import { expect } from 'chai';
import chalk = require('chalk');
import { providers } from 'ethers';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Contract } from '../src';

const BASE_PATH = './data/smoke/';

const addr = chalk.cyan;
const error = chalk.red;
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
        // await wait(500);
        return code;
    },
};

// function wait(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }
describe('etherscan', function () {
    /**
     * Needs to be manually downloaded from
     *
     * https://etherscan.io/exportData?type=open-source-contract-codes
     */
    const csv = readFileSync('data/export-verified-contractaddress-opensource-license.csv');
    csv.toString()
        .trimEnd()
        .split('\n')
        .map(entry => entry.trimEnd().replace(/"/g, '').split(',') as [string, string, string])
        // .slice(0, 500)
        .forEach(([_tx, address, name]) => {
            it(`should decode & decompile ${name} ${address}`, async function () {
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
});
