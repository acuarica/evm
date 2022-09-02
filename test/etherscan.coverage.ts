import { expect } from 'chai';
import { readFileSync } from 'fs';
import EVM from './utils/evmtest';

describe('etherscan', () => {
    const BASE_PATH = './data/smoke/';
    const csv = readFileSync('data/export-verified-contractaddress-opensource-license.csv');
    csv.toString()
        .split('\n')
        .map(entry => entry.trimEnd().replace(/"/g, '').split(',') as [string, string, string])
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
                    expect(() => evm.getBlocks()).to.throw(
                        '`Stack.Error: POP with empty stack` at [1158] MSTORE =| '
                    );
                } else if (
                    [
                        'FairXYZWallets-0x033870acf44FaB6342EF1a114A6826D2F8D15B03',
                        'VotingContract-0x60Fb0abAECc398F122c28dafc288D3EE6c2835D6',
                    ].includes(name + '-' + address)
                ) {
                    expect(() => evm.getBlocks()).to.throw(
                        'TypeError: storeLocation.items is not iterable'
                    );
                } else {
                    evm.getBlocks();
                    evm.decompile();
                }
            });
        });
});
