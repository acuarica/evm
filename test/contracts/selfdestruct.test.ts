import { expect } from 'chai';
import { OPCODES } from '../../src/opcode';
import EVM from '../utils/evmtest';
import { compile } from './utils/solc';

const CONTRACT = `
contract C {
    function () external {
        selfdestruct(msg.sender);
    }
}
`;

describe('contracts::selfdestruct', () => {
    let evm: EVM;

    before(() => {
        evm = new EVM(compile('C', CONTRACT));
    });

    it('should detect selfdestruct', () => {
        expect(evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.true;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.true;
    });
});
