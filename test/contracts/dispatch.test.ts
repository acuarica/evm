import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';
import Contract from './utils/solc';

describe('contracts::dispatch', () => {
    describe('single method', () => {
        const CONTRACT = `
        pragma solidity 0.5.5;
        contract Contract {
            function get() external pure returns (uint8) {
                return 5;
            }
        }`;

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

        it('should decompile functions', () => {
            expect(evm.decompile()).to.match(/function get\(\) public view payable/);
        });
    });

    describe('simple', () => {
        const CONTRACT = `pragma solidity 0.5.5;
        contract Contract {
            uint256 data = 0;
            function symbol() public { data = 1; }
            function get() public pure returns (uint256) { return 5; }
            function thisAddress() public view returns (address) { return address(this); }
        }`;

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

        it('should function signatures', () => {
            expect(evm.decompile()).to.match(/return\(this\);$/m);
        });
    });
});
