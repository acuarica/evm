import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';
import Contract from './utils/solc';

const CONTRACT = `
pragma solidity 0.5.5;

contract Contract {

    uint256 data = 0;

    function symbol() public {
        data = 1;
    }

    function get() public pure returns (uint256) {
        return 5;
    }
}
`;

describe('contracts::dispatch', () => {
    let contract: Contract;
    let evm: EVM;

    before(() => {
        contract = new Contract();
        contract.load('Contract', CONTRACT);
        evm = new EVM(contract.bytecode());
    });

    it('should compile without errors', () => {
        expect(contract.valid(), contract.errors().join('\n')).to.be.true;
    });

    it('should not detect selfdestruct', () => {
        expect(evm.containsOpcode(SELFDESTRUCT)).to.be.false;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
    });

    it('should retrieve function signatures', () => {
        expect(new Set(evm.getFunctions())).to.be.deep.equal(new Set(['symbol()', 'get()']));
    });
});
