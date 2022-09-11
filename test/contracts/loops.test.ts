import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('loops', (version, fallback) => {
    it('should `decompile` contract with `for` loop', function () {
        const CONTRACT = `contract Contract {
            uint256 total = 0;
            ${fallback}() external payable {
                uint256 sum = 0xa;
                for (uint256 i = 9; i < block.number; i++) {
                    sum += i;
                }

                total = sum;
            }
        }`;

        const evm = new EVM(compile(CONTRACT, version));

        const text = evm.decompile();
        expect(text, text).to.match(/< block\.number/);
    });

    it('should `decompile` contract with `while` loop', () => {
        const CONTRACT = `contract Contract {
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
        const evm = new EVM(compile(CONTRACT, version));
        evm.contract;
    });

    it('non-terminating `while` loop', () => {
        const CONTRACT = `contract Contract {
            function loop() external pure returns (uint256) {
                uint256 sum = 0;
                uint256 i = 0;
                while (true) {
                    sum += i;
                    i++;
                }
                return sum;
            }
        }`;
        const evm = new EVM(compile(CONTRACT, version));
        evm.contract;
    });
});
