import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile } from './utils/solc';

describe('contracts::symbols', () => {
    const CONTRACT = `
        contract C {
            address _addr;
            function getBlockHash() public view returns (bytes32) { return blockhash(7); }
            function getBalance(address eoa) public view returns (uint256) { return eoa.balance; }
            function getThis() public view returns (address) { return address(this); }
            function setThis() public { _addr = address(this); }
        }`;

    let evm: EVM;

    before(() => {
        evm = new EVM(compile('C', CONTRACT));
    });

    it('should find `BLOCKHASH` symbol', () => {
        expect(evm.decompile()).to.match(/return blockhash\(7\);$/m);
    });

    it('should find `BALANCE` symbol', () => {
        expect(evm.decompile()).to.match(/return _arg0.balance;$/m);
    });

    it('should find `ADDRESS` symbol', () => {
        expect(evm.decompile()).to.match(/return this;$/m);
    });
});
