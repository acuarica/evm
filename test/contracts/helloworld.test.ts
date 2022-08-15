import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';
import Contract from '../utils/contract.class';

describe('helloworld.sol', () => {
    const contract = new Contract();
    contract.loadFile('helloworld.sol');
    const evm = new EVM(contract.bytecode());

    it('should compile without errors', () => {
        expect(contract.valid(), contract.errors().join('\n')).to.be.true;
    });

    it('should not detect selfdestruct', () => {
        expect(evm.containsOpcode(SELFDESTRUCT)).to.be.false;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
