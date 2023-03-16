import { expect } from 'chai';
import { EVM } from '../src/evm';
import { fnselector } from './utils/selector';
import { compile } from './utils/solc';

describe('evm', () => {
    it('should create ', function () {
        const sol = `contract C {
                modifier onlyOwner {
                    require(block.timestamp == 5);
                    uint256 n = block.number;
                    for (uint256 i = 0; i < block.number; i++) {
                        n += block.number * i;
                    }
                    n += gasleft();
                    require(n == 9);
                    _;
                 }

                function name() external view onlyOwner returns (uint256) {
                    return 7;
                }

                function symbol() external view onlyOwner returns (uint256) {
                    return 11;
                }
            }`;

        const evm = EVM.from(compile(sol, '0.7.6', { context: this }).deployedBytecode);
        evm.start();
        expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });
});
