import { readFileSync } from 'fs';
import EVM from './utils/evmtest';

describe('etherscan', () => {
    it.skip(`should correctly decode bytecode from open source`, () => {
        const BASE_PATH = './data/smoke/';
        const csv = readFileSync('data/export-verified-contractaddress-opensource-license.csv');
        const lines = csv.toString().split('\n');
        const addresses = lines
            .map(entry => entry.trimEnd().replace(/"/g, '').split(',') as [string, string, string])
            .filter(([, address]) => address !== '0xba31ab04a7fe99641e1e7884c21ecbe2692a3cdc');
        for (const [, address, name] of addresses) {
            const path = `${BASE_PATH}${name}-${address}.bytecode`;
            console.log(path);
            const bytecode = readFileSync(path, 'utf8');
            const evm = new EVM(bytecode);
            try {
                evm.getOpcodes();
                evm.decompile();
            } catch (err) {
                console.log('Error in', path, 'at offset', evm.pc);
                throw err;
            }
        }
    });
});
