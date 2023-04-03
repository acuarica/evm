import assert = require('assert');
import { expect } from 'chai';
import { EVM } from '../../src/evm';
import type { Expr, Inst } from '../../src/evm/expr';
import { INFO, SYM, Symbol0 } from '../../src/evm/sym';
import { State } from '../../src/state';
import { typeOfSym } from '../../src/types';
import { compile } from '../utils/solc';

describe('evm::sym', () => {
    for (const [name, value] of Object.entries(INFO)) {
        describe(`\`${value}\` from \`${name}\``, () => {
            it('should get it programatically', () => {
                const state = new State<never, Expr>();
                SYM[name](state);

                const expr = new Symbol0(value);
                expect(state.stack.values).to.be.deep.equal([expr]);
                expect(expr.str()).to.be.deep.equal(value);
            });

            it('should get it from compiled code', function () {
                const sol = ['msize()', 'codesize()', 'returndatasize()'].includes(value)
                    ? `contract C {
                        event Deposit(${typeOfSym(value)});
                        fallback() external payable {
                            uint256 value; assembly { value := ${value} }
                            emit Deposit(value);
                        }
                    }`
                    : `contract C {
                        event Deposit(${typeOfSym(value)});
                        fallback() external payable { emit Deposit(${value}); }
                    }`;

                const evm = new EVM(compile(sol, '0.8.16', { context: this }).bytecode);
                let state = new State<Inst, Expr>();
                evm.run(0, state);

                while (state.last?.name === 'Jump') {
                    state = state.last.destBranch.state;
                }

                const stmt = state.stmts[0];
                assert(stmt.name === 'Log');
                expect(stmt.args[0].eval()).to.be.deep.equal(new Symbol0(value));
            });
        });
    }
});
