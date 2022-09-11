import { expect } from 'chai';
import { readFileSync } from 'fs';
import EVM from './utils/evmtest';

describe('etherscan', () => {
    const BASE_PATH = './data/smoke/';
    const csv = readFileSync('data/export-verified-contractaddress-opensource-license.csv');
    csv.toString()
        .split('\n')
        .map(entry => entry.trimEnd().replace(/"/g, '').split(',') as [string, string, string])
        .slice(0, 100)
        .forEach(([, address, name]) => {
            const path = `${BASE_PATH}${name}-${address}.bytecode`;
            const bytecode = readFileSync(path, 'utf8');

            it(`should decode & decompile ${path}`, () => {
                const evm = new EVM(bytecode);
                if (
                    [
                        'Vyper_contract-0x5c22c615eefbaa896c6e34db8d1e9835ae215832',
                        'Vyper_contract-0xA9b2F5ce3aAE7374a62313473a74C98baa7fa70E',
                    ].includes(name + '-' + address)
                ) {
                    expect(() => evm.contract).to.throw(
                        '`Stack.Error: POP with empty stack` at [1158] MSTORE =| '
                    );
                } else if (
                    [
                        'FairXYZWallets-0x033870acf44FaB6342EF1a114A6826D2F8D15B03',
                        'VotingContract-0x60Fb0abAECc398F122c28dafc288D3EE6c2835D6',
                    ].includes(name + '-' + address)
                ) {
                    expect(() => evm.contract).to.throw(
                        'TypeError: storeLocation.items is not iterable'
                    );
                } else if (
                    [
                        'Snapshots-0xba31ab04a7fe99641e1e7884c21ecbe2692a3cdc',
                        'RocketMinipoolFactory-0x54705f80D7C51Fcffd9C659ce3f3C9a7dCCf5788',
                        'RocketNodeDistributorFactory-0xe228017f77B3E0785e794e4c0a8A6b935bB4037C',
                    ].includes(name + '-' + address)
                ) {
                    expect(() => evm.contract).to.throw('Error: memargs sizeclass');
                } else {
                    const contract = evm.contract;

                    const externals = [
                        ...Object.values(contract.functions)
                            .filter(fn => fn.label !== fn.hash + '()')
                            .map(fn => fn.label),
                        ...Object.values(contract.variables)
                            .filter(v => v.label !== undefined)
                            .map(v => v.label + '()'),
                    ];
                    expect(evm.getFunctions().sort()).to.include.members(externals.sort());

                    evm.decompile();
                }
            });
        });
});
