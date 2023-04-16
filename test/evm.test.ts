import { expect } from 'chai';
import { EVM, INSTS } from '../src/evm';
import { compile } from './utils/solc';
import { State } from '../src/state';
import type { Expr, Inst } from '../src/evm/expr';
import { Invalid } from '../src/evm/system';

describe('evm', () => {
    it('should halt with `INVALID`', () => {
        const state = new State<Inst, Expr>();
        INSTS.INVALID({ offset: 0, pc: 0, opcode: 1, mnemonic: 'INVALID', pushData: null }, state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new Invalid(1)]);
        expect(`${state.stmts[0]}`).to.be.equal("revert('Invalid instruction (0x1)');");
    });

    describe('conditional', () => {
        it('if ', function () {
            const sol = `contract C {
                uint256 value = 0;
                event Deposit(uint256);
                fallback () external payable {
                    uint256 temp = value;
                    if (block.number % 2 == 0) {
                        temp += block.number + gasleft();
                    }
                    value = temp;
                    emit Deposit(temp);
                }
            }`;

            const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
            evm.start();
            expect(evm.functionBranches).to.be.empty;
        });
    });

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

                function name(uint256 n) external view onlyOwner(n) returns (uint256) {
                    return 7;
                }

                function symbol(uint256 m) external view onlyOwner(m) returns (uint256) {
                    return 11;
                }
            }`;

        const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it.skip('should for loop', function () {
        const sol = `contract C { event Deposit(uint256);
            fallback() external payable {
                for (uint256 i = 0; i < 10; i++) emit Deposit(i);
            }
        }`;
        const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it.skip('should for infinite', function () {
        const sol = `contract C { event Deposit(uint256);
            fallback() external payable {
                for (uint256 i = 0; i < block.number; ) emit Deposit(i);
            }
        }`;
        const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    describe('recursive', () => {
        it.skip('should for infinite', function () {
            const sol = `contract C {
                event Transfer(uint256);
                function transfer(uint256 amount) public {
                    emit Transfer(amount);
                    // if (amount % 2 == 0) {
                        _transfer(amount + 5);
                    // }
                }
                function _transfer(uint256 amount) internal returns (uint256) {
                    if (amount % 2 == 0) {
                        transfer(amount + 5);
                    }
                    return amount + 7;
                }
        }`;

            const evm = new EVM(
                compile(sol, '0.7.6', { context: this, severity: 'info' }).bytecode
            );
            evm.start();
            // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
        });
    });
});
