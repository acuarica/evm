import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile } from './utils/solc';
import { readFileSync } from 'fs';
import { OPCODES } from '../../src/opcode';

describe('contracts::helloworld', () => {
    let evm: EVM;

    before(() => {
        // const source = readFileSync('./test/contracts/Cryptomeria.sol', 'utf8');
        const source = readFileSync('./test/contracts/Snapshots.sol', 'utf8');
        evm = new EVM(compile('Cryptomeria', source, '0.8.16'));

        // console.log(evm.getBytecode());
        // evm.getOpcodes().forEach(op => console.log(op.toString()));
    });

    it('should not detect selfdestruct', () => {
        console.log(evm.decompile());
        // console.log(evm.decompile());
        expect(evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
    }).timeout(2000);
});
