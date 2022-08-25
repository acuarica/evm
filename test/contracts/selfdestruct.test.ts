import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';
import { compile } from './utils/solc';

const CONTRACT = `
pragma solidity 0.5.5;

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
        expect(evm.containsOpcode(SELFDESTRUCT)).to.be.true;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.true;
    });
});
