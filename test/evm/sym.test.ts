import assert = require('assert');
import { expect } from 'chai';
import { EVM } from '../../src/evm';
import type { Expr, Stmt } from '../../src/evm/ast';
import { INFO, SYM, Symbol0 } from '../../src/evm/sym';
import { State } from '../../src/state';
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

            it('should get it from compiled code', function () {
                if (
                    [
                        'msg.sender',
                        'memory.length',
                        'self.balance',
                        'chainid',
                        'block.coinbase',
                        'output.length',
                        'this.code.length',
                        'tx.origin',
                        'this',
                    ].includes(value)
                ) {
                    this.skip();
                }

                const sol = `contract C {
                    event Deposit(uint256);
                    fallback() external payable {
                        emit Deposit(${value});
                    }
                }`;
                const evm = EVM.from(compile(sol, '0.7.6', { context: this }).bytecode);
                const state = new State<Stmt, Expr>();
                evm.exec(0, state);

                const stmt = state.stmts[0];
                assert(stmt.name === 'Log');
                expect(stmt.args[0]).to.be.deep.equal(new Symbol0(value));
            });
        });
    }
});
