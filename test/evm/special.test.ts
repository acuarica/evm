import { expect } from 'chai';

import { EVM, London, Shanghai, State, reduce } from 'sevm';
import type { Expr, Inst, Log } from 'sevm/ast';
import { Props } from 'sevm/ast';

import { compile } from '../utils/solc';

describe('evm::special', function () {
    for (const [name, prop] of Object.entries(Props)) {
        describe(`\`${prop.symbol}\` prop pushed from \`${name}\``, function () {
            it('should get it from compiled code', function () {
                const src = ['msize()', 'codesize()', 'returndatasize()'].includes(prop.symbol)
                    ? `contract Test {
                        event Deposit(${prop.type});
                        fallback() external payable {
                            uint256 value; assembly { value := ${prop.symbol} }
                            emit Deposit(value);
                        }
                    }`
                    : `contract Test {
                        event Deposit(${prop.type});
                        fallback() external payable { emit Deposit(${prop.symbol}); }
                    }`;

                const evm = name === 'block.difficulty'
                    ? new EVM(compile(src, '0.8.16', this).bytecode, London())
                    : new EVM(compile(src, '0.8.21', this).bytecode, Shanghai());
                let state = new State<Inst, Expr>();
                evm.run(0, state);

                while (state.last?.name === 'Jump') {
                    state = state.last.destBranch.state;
                }

                const stmts = reduce(state.stmts);
                console.log(stmts);
                const stmt = stmts[0];
                expect(stmt.name).to.be.equal('Log');
                expect((<Log>stmt).args![0].eval()).to.be.deep.equal(prop);
            });
        });
    }
});
