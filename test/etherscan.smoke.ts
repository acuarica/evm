import { existsSync, readFileSync, writeFileSync } from 'fs';

import { expect } from 'chai';
import c = require('ansi-colors');
import { providers } from 'ethers';

import { Contract } from '../src';
import type { Throw } from '../src/evm/expr';

/**
 * Restricts the number of Etherscan contracts to test.
 * If provided, tests only the first `MAX` contracts.
 * Otherwise, tests all contracts.
 */
const MAX = process.env['MAX'];

/**
 * Filters the Etherscan contracts to test.
 * If provided, tests the contracts where their names matches `CONTRACT`.
 * Otherwise, tests all contracts.
 */
const CONTRACT = process.env['CONTRACT'];

const addr = c.cyan;
const error = c.red;
const warn = c.yellow;
const info = c.blue;

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

    const csvPath = 'test/export-verified-contractaddress-opensource-license.csv';
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

    const errorsByContract = new Map<string, Throw[]>();
    const metadataStats = new (class {
        noMetadata = 0;
        readonly protocols = new Set<string>();
        readonly solcs = new Set<string>();

        append(metadata: Contract['metadata']) {
            if (metadata) {
                this.protocols.add(metadata.protocol);
                this.solcs.add(metadata.solc);
            } else {
                this.noMetadata++;
            }
        }
    })();

    const selectorStats = new (class {
        readonly hitSelectors = new Set<string>();
        readonly missedSelectors = new Set<string>();

        append(functions: Contract['functions']) {
            for (const fn of Object.values(functions)) {
                (fn.label !== undefined ? this.hitSelectors : this.missedSelectors).add(
                    fn.selector
                );
            }
        }
    })();

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
                const BASE_PATH = '.etherscan/';
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
                metadataStats.append(contract.metadata);
                selectorStats.append(contract.functions);

                if (contract.evm.errors.length > 0) {
                    errorsByContract.set(`${name}-${address}`, contract.evm.errors);
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
        console.info('\n  Metadata Stats');
        console.info(`    • ${info('No metadata')} ${metadataStats.noMetadata}`);
        console.info(`    • ${info('Protocols')} ${[...metadataStats.protocols].join('|')}`);
        console.info(`    • ${info('SOLC versions')} ${[...metadataStats.solcs].join('|')}`);
        console.info('\n  Selector Stats');
        console.info(`    • ${info('Hit selectors')} ${selectorStats.hitSelectors.size}`);
        console.info(`    • ${info('Missed selectors')} ${selectorStats.missedSelectors.size}`);
        console.info(`\n  Errors (${warn(`${errorsByContract.size}`)} contracts)`);
        for (const [id, errors] of errorsByContract.entries()) {
            console.info(warn(`    • ${id} - ${errors.length} error(s)`));
            const errorsByReason = new Map<string, number>();
            errors.forEach(err => {
                const count = errorsByReason.get(err.reason) ?? 0;
                errorsByReason.set(err.reason, count + 1);
            });
            for (const [reason, count] of errorsByReason) {
                console.info(
                    '        ' + error('x'),
                    reason,
                    count === 1 ? '' : warn(`(x${count})`)
                );
            }
        }
    });
});
