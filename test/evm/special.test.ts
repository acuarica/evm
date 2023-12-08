import { expect } from 'chai';

import { EVM, State, reduce } from 'sevm';
import type { Expr, Inst, Log } from 'sevm/ast';
import { Info } from 'sevm/ast';

import { compile } from '../utils/solc';

describe('evm::special', function () {
    for (const [mnemonic, sym] of Object.entries(Info)) {
        describe(`\`${sym.value}\` prop pushed from \`${mnemonic}\``, function () {
            it('should get it from compiled code', function () {
                const src = ['msize()', 'codesize()', 'returndatasize()'].includes(sym.value)
                    ? `contract Test {
                        event Deposit(${sym.type});
                        fallback() external payable {
                            uint256 value; assembly { value := ${sym.value} }
                            emit Deposit(value);
                        }
                    }`
                    : `contract Test {
                        event Deposit(${sym.type});
                        fallback() external payable { emit Deposit(${sym.value}); }
                    }`;

                const evm = new EVM(compile(src, '0.8.16', this).bytecode);
                let state = new State<Inst, Expr>();
                evm.run(0, state);

                while (state.last?.name === 'Jump') {
                    state = state.last.destBranch.state;
                }

                const stmts = reduce(state.stmts);
                const stmt = stmts[0];
                expect(stmt.name).to.be.equal('Log');
                expect((<Log>stmt).args![0].eval()).to.be.deep.equal(sym);
            });
        });
    }
});
