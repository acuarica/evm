import assert = require('assert');
import { expect } from 'chai';
import type { Expr, Stmt } from '../../src/evm/ast';
import { INFO, SYM, Symbol0 } from '../../src/evm/sym';
import { State } from '../../src/state';
import { EVM } from '../utils/evm';
import { compile } from '../utils/solc';

describe('evm::sym', () => {
    for (const [name, value] of Object.entries(INFO)) {
        describe(`\`${value}\` from \`${name}\``, () => {
            it('should get it programatically', () => {
                const state = new State<never, Expr>();
                SYM[name as keyof typeof INFO](state);

                const expr = new Symbol0(value);
                expect(state.stack.values).to.be.deep.equal([expr]);
                expect(expr.str()).to.be.deep.equal(value);
            });

            const sol = `contract C {
                event Deposit(uint256);
                fallback() external payable {
                    emit Deposit(block.number);
                }
            }`;

            let evm: ReturnType<typeof EVM>;

            before(function () {
                evm = EVM(compile(sol, '0.7.6', { context: this }).deployedBytecode);
            });

            it('should get it from compiled code', () => {
                const state = new State<Stmt, Expr>();
                evm.exec(0, state);

                const stmt = state.stmts[0];
                assert(stmt.name === 'Log');
                expect(stmt.args[0]).to.be.deep.equal(new Symbol0('block.number'));
            });
        });
    }
});
