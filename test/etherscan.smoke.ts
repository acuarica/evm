// import { expect } from 'chai';
import chalk = require('chalk');
import { providers } from 'ethers';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { EVM } from '../src/evm';

const BASE_PATH = './data/smoke/';

const addr = chalk.cyan;
const error = chalk.red;
const provider = {
    providers: [
        new providers.InfuraProvider(),
        // new providers.AlchemyProvider(),
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
        // .slice(0, 4000)
        .forEach(([_tx, address, name]) => {
            it(`should decode & decompile ${name} ${address}`, async function () {
                if (
                    [
                        // 'InuNetwork',
                        'MetaShibarium',
                        'mirageAuction',
                        'BSN',
                        'ShibariumDollar',
                    ].includes(name)
                ) {
                    // this.skip();
                }

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
                const evm = new EVM(bytecode);
                if (
                    [
                        'Vyper_contract-0x5c22c615eefbaa896c6e34db8d1e9835ae215832',
                        'Vyper_contract-0xA9b2F5ce3aAE7374a62313473a74C98baa7fa70E',
                    ].includes(name + '-' + address)
                ) {
                    // expect(() => evm.contract).to.throw(
                    //     '`Stack.Error: POP with empty stack` at [1158] MSTORE =| '
                    // );
                } else if (
                    [
                        'FairXYZWallets-0x033870acf44FaB6342EF1a114A6826D2F8D15B03',
                        'VotingContract-0x60Fb0abAECc398F122c28dafc288D3EE6c2835D6',
                    ].includes(name + '-' + address)
                ) {
                    // expect(() => evm.contract).to.throw(
                    //     'TypeError: storeLocation.items is not iterable'
                    // );
                } else if (
                    [
                        'Snapshots-0xba31ab04a7fe99641e1e7884c21ecbe2692a3cdc',
                        'RocketMinipoolFactory-0x54705f80D7C51Fcffd9C659ce3f3C9a7dCCf5788',
                        'RocketNodeDistributorFactory-0xe228017f77B3E0785e794e4c0a8A6b935bB4037C',
                    ].includes(name + '-' + address)
                ) {
                    // expect(() => evm.contract).to.throw('Error: memargs sizeclass');
                } else {
                    // const contract = evm.contract;
                    // const externals = [
                    //     ...Object.values(contract.functions)
                    //         .filter(fn => fn.label !== fn.hash + '()')
                    //         .map(fn => fn.label),
                    //     ...Object.values(contract.variables)
                    //         .filter(v => v.label !== undefined)
                    //         .map(v => v.label! + '()'),
                    // ];
                    // expect(evm.getFunctions().sort()).to.include.members(externals.sort());
                }

                evm.start();
                // evm.run(0, new State());
                // for (const [selector, branch] of evm.functionBranches) {
                //     console.log(selector);
                //     evm.run(branch.pc, branch.state);
                // }
            });
        });
});
