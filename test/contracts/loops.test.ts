import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('loops', (compile, fallback) => {
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

        const evm = new EVM(compile(CONTRACT, this));

        const text = evm.decompile();
        expect(text, text).to.match(/block\.number/);
        // expect(text, text).to.match(/while/);
    });

    it('should `decompile` contract with `while` loop', function () {
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
        const evm = new EVM(compile(CONTRACT, this));
        evm.contract;
    });

    it('non-terminating `while` loop', function () {
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
        const evm = new EVM(compile(CONTRACT, this));
        evm.contract;
    });
});
