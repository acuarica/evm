import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('loops', version => {
    describe('`for` loop', () => {
        let evm: EVM;

        before(() => {
            const CONTRACT = `contract C {
                function loop(uint256 n) external pure returns (uint256) {
                    uint256 sum = 0;
                    for (uint256 i = 0; i < n; i++) {
                        sum += i;
                    }
                    return sum;
                }
            }`;
            evm = new EVM(compile('C', CONTRACT, version));
        });

        it('should get blocks', () => {
            const blocks = evm.getBlocks();
            expect(blocks).to.not.undefined;
        });
    });

    describe('`while` loop', () => {
        let evm: EVM;

        before(() => {
            const CONTRACT = `contract C {
                function loop(uint256 n) external pure returns (uint256) {
                    uint256 sum = 0;
                    uint256 i = 0;
                    while (i < n) {
                        sum += i;
                        i++;
                    }
                    return sum;
                }
            }`;
            evm = new EVM(compile('C', CONTRACT, version));
        });

        it('should get blocks', () => {
            const blocks = evm.getBlocks();
            expect(blocks).to.not.undefined;
        });
    });
});
