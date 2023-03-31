import { expect } from 'chai';
import chalk = require('chalk');
import { providers } from 'ethers';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Contract } from '../src';
import type { Throw } from '../src/evm/expr';

const MAX = process.env['MAX'];
const CONTRACT = process.env['CONTRACT'];

const addr = chalk.cyan;
const error = chalk.red;
const warn = chalk.yellow;

const provider = {
    providers: [
        new providers.InfuraProvider(),
        new providers.EtherscanProvider(),
        new providers.CloudflareProvider(),
        new providers.PocketProvider(),
    ],
    current: 0,
    getCode: async function (address: string) {
        this.current = (this.current + 1) % this.providers.length;
        const code = await this.providers[this.current].getCode(address);
        return code;
    },
};

describe(`etherscan | MAX=\`${MAX ?? ''}\` CONTRACT=\`${CONTRACT}\``, function () {
    this.bail(true);

    const csvPath = 'data/export-verified-contractaddress-opensource-license.csv';
    let csv: Buffer;
    try {
        /**
         * Needs to be manually downloaded from
         *
         * https://etherscan.io/exportData?type=open-source-contract-codes
         */
        csv = readFileSync(csvPath);
    } catch {
        it.skip(`Addresses CSV \`${csvPath}\` not found, skipping`, () => {});
        return;
    }

    const errors = new Map<string, Throw[]>();

    csv.toString()
        .trimEnd()
        .split('\n')
        .map(
            entry =>
                entry.trimEnd().replace(/"/g, '').split(',') as [
                    tx: string,
                    address: string,
                    name: string
                ]
        )
        .filter(
            ([_, name, address]) => CONTRACT === undefined || `${name} ${address}`.match(CONTRACT)
        )
        .slice(0, MAX !== undefined ? parseInt(MAX) : undefined)
        .forEach(([_tx, address, name]) => {
            it(`should decode & decompile ${name} ${address}`, async function () {
                const BASE_PATH = './data/smoke/';
                const path = `${BASE_PATH}${name}-${address}.bytecode`;
                if (!existsSync(path)) {
                    this.timeout(10000);
                    console.log(`Fetching code for ${name} at ${addr(address)} into ${BASE_PATH}`);
                    try {
                        const code = await provider.getCode(address);
                        writeFileSync(path, code);
                    } catch (err) {
                        console.info(
                            error((err as { message: string }).message),
                            provider.providers[provider.current]
                        );
                    }
                }

                const bytecode = readFileSync(path, 'utf8');
                if (bytecode === '0x') {
                    return;
                }

                const contract = new Contract(bytecode).patch();
                if (contract.evm.errors.length > 0) {
                    errors.set(`${name}-${address}`, contract.evm.errors);
                }

                const externals = [
                    ...Object.values(contract.functions).flatMap(fn =>
                        fn.label !== undefined ? [fn.label] : []
                    ),
                    ...Object.values(contract.evm.variables).flatMap(v =>
                        v.label !== undefined ? [v.label + '()'] : []
                    ),
                ];
                expect(contract.getFunctions().sort()).to.include.members(externals.sort());
            });
        });

    after(() => {
        console.info(`\n  Errors (${warn(errors.size)} contracts)`);
        for (const [id, errs] of errors.entries()) {
            console.info(warn('    -', id + ` (${errs.length} error(s))`));
            errs.forEach(err => {
                console.info('        ' + err.reason);
            });
        }
    });
});
