import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile } from './utils/solc';
import { OPCODES } from '../../src/opcode';

describe('contracts::dispatch', () => {
    describe('single method', () => {
        const CONTRACT = `
        contract Contract {
            function get() external pure returns (uint8) {
                return 5;
            }
        }`;

        let evm: EVM;

        before(() => {
            evm = new EVM(compile('Contract', CONTRACT, '0.8.16'));
        });

        it('should decompile functions', () => {
            expect(evm.decompile()).to.match(/function get\(\) public view payable/);
        });
    });

    describe('simple', () => {
        const CONTRACT = `
        contract Contract {
            uint256 data = 0;
            function symbol() public { data = 1; }
            function get() public pure returns (uint256) { return 5; }
            function thisAddress() public view returns (address) { return address(this); }
        }`;

        let evm: EVM;

        before(() => {
            evm = new EVM(compile('Contract', CONTRACT, '0.8.16'));
        });

        it('should not detect selfdestruct', () => {
            expect(evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
            expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
        });

        it('should function signatures', () => {
            expect(evm.decompile()).to.match(/return this;$/m);
        });
    });
});
