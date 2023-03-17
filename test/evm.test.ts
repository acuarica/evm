import { expect } from 'chai';
import { EVM } from '../src/evm';
import { fnselector } from './utils/selector';
import { compile } from './utils/solc';

describe('evm', () => {
    it('should create ', function () {
        const sol = `contract C {
                modifier onlyOwner(uint256 m) {
                    // require(block.timestamp == 5);
                    // uint256 n = block.number;
                    for (uint256 i = 0; i < block.number; i++) {
                        m += block.number * i;
                    }
                    // n += gasleft();
                    require(m == 9);
                    _;
                 }

                // function name(uint256 n) external pure onlyOwner(n) returns (uint256) {
                //     return 7;
                // }

                function symbol(uint256 m) external view onlyOwner(m) returns (uint256) {
                    return 11;
                }
            }`;

        const evm = EVM.from(compile(sol, '0.8.16', { context: this }).deployedBytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it('should for ', function () {
        const sol = `contract C { event Deposit(uint256);
            fallback() external payable {
                for (uint256 i = 0; i < block.number; i++) emit Deposit(i);
            }
        }`;
        const evm = EVM.from(compile(sol, '0.7.6', { context: this }).deployedBytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it('should for infinite', function () {
        const sol = `contract C { event Deposit(uint256);
            fallback() external payable {
                for (uint256 i = 0; i < block.number; ) emit Deposit(i);
            }
        }`;
        const evm = EVM.from(compile(sol, '0.7.6', { context: this }).deployedBytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });
});
