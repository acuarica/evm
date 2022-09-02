import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { verifyBlocks } from '../utils/verify';
import { compile, contract } from './utils/solc';

contract('dispatch', version => {
    describe('for a contract with a single `external` method', () => {
        const CONTRACT = `
            contract Contract {
                function get() external pure returns (uint256) {
                    return 5;
                }
        }`;
        let evm: EVM;

        before(() => {
            evm = new EVM(compile('Contract', CONTRACT, version));
        });

        it('should have verified blocks', () => {
            verifyBlocks(evm);
        });

        it('should detect functions', () => {
            expect(evm.getFunctions()).to.have.members(['get()']);
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, `decompiled bytecode\n${text}`).to.match(
                /function get\(\) public view payable/
            );
        });
    });

    describe('for a contract with multiple `external` functions', () => {
        const CONTRACT = `
            contract Contract {
                function balanceOf(uint256 from) external pure returns (uint256) { return from; }
                function symbol() external pure returns (uint256) { return 3; }
                function thisAddress() external view returns (address) { return address(this); }
            }`;
        let evm: EVM;

        before(() => {
            evm = new EVM(compile('Contract', CONTRACT, version));
        });

        it('should detect functions', () => {
            expect(evm.getFunctions()).to.have.members([
                'balanceOf(uint256)',
                'symbol()',
                'thisAddress()',
            ]);
        });

        it('should decompile bytecode', () => {
            const text = evm.decompile();
            expect(text, `decompiled bytecode\n${text}`).to.match(/return this;$/m);
        });
    });
});
