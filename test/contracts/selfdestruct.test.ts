import { expect } from 'chai';
import { Contract } from '../../src';
import { OPCODES } from '../../src/opcode';
import { contracts } from '../utils/solc';

contracts('selfdestruct', (compile, fallback, version) => {
    let contract: Contract;

    if (version === '0.8.16') return;

    before(function () {
        const sol = `contract C {
            ${fallback}() external {
                selfdestruct(msg.sender);
            }
        }`;
        contract = new Contract(compile(sol, this).bytecode);
    });

    it('should detect selfdestruct', () => {
        expect(contract.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.true;
        expect(contract.containsOpcode('SELFDESTRUCT')).to.be.true;
    });
});
