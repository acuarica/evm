import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';
import { solc } from './utils/solc';

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
        evm = new EVM(solc('C', CONTRACT));
    });

    it('should detect selfdestruct', () => {
        expect(evm.containsOpcode(SELFDESTRUCT)).to.be.true;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.true;
    });
});
