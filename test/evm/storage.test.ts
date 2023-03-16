import { expect } from 'chai';
import { EVM } from '../../src/evm';
import { compile } from '../utils/solc';

describe('evm::storage', () => {
    it('should find storage variable', function () {
        const sol = `contract C {
            uint256 val1 = 5;
            uint256 val2 = 7;

            fallback() external payable {
                val1 += 3;
                val2 += 11;
            }
        }`;
        const evm = EVM.from(compile(sol, '0.7.6', { context: this }).deployedBytecode);
        evm.start();
        expect(evm.variables).to.be.have.keys('0x0', '0x1');
    });

    it.skip('should find storage struct', function () {
        const sol = `contract C {
            struct T {
                uint256 val1;
                uint256 val2;
            }

            T t;

            fallback() external payable {
                t.val1 += 3;
                t.val2 += 11;
            }
        }`;
        const evm = EVM.from(compile(sol, '0.7.6', { context: this }).deployedBytecode);
        evm.start();
        expect(evm.variables).to.be.have.keys('0x0', '0x1');
        expect(evm.mappings).to.be.deep.equal({});
    });
});
