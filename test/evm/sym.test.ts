import { expect } from 'chai';
import { EVM } from '../../src/evm';
import type { Expr, Inst } from '../../src/evm/expr';
import { Block, Info, Msg, SYM, Tx } from '../../src/evm/sym';
import { State } from '../../src/state';
import { compile } from '../utils/solc';
import type { Log } from '../../src/evm/log';

describe('evm::sym', () => {
    it(`should stringify Block's props`, () => {
        expect(`${Block.basefee}`).to.be.equal('block.basefee');
        expect(`${Block.chainid}`).to.be.equal('block.chainid');
        expect(`${Block.coinbase}`).to.be.equal('block.coinbase');
        expect(`${Block.difficulty}`).to.be.equal('block.difficulty');
        expect(`${Block.gaslimit}`).to.be.equal('block.gaslimit');
        expect(`${Block.number}`).to.be.equal('block.number');
        expect(`${Block.timestamp}`).to.be.equal('block.timestamp');
    });

    it(`should stringify Msg's props`, () => {
        expect(`${Msg.sender}`).to.be.equal('msg.sender');
    });

    it(`should stringify Tx's props`, () => {
        expect(`${Tx.origin}`).to.be.equal('tx.origin');
        expect(`${Tx.gasprice}`).to.be.equal('tx.gasprice');
    });

    for (const [mnemonic, sym] of Object.entries(Info)) {
        describe(`\`${sym.value}\` from \`${mnemonic}\``, () => {
            it('should get it programatically', () => {
                const state = new State<never, Expr>();
                SYM[mnemonic](state);

                expect(state.stack.values).to.be.deep.equal([sym]);
            });

            it('should get it from compiled code', function () {
                const sol = ['msize()', 'codesize()', 'returndatasize()'].includes(sym.value)
                    ? `contract C {
                        event Deposit(${sym.type});
                        fallback() external payable {
                            uint256 value; assembly { value := ${sym.value} }
                            emit Deposit(value);
                        }
                    }`
                    : `contract C {
                        event Deposit(${sym.type});
                        fallback() external payable { emit Deposit(${sym.value}); }
                    }`;

                const evm = new EVM(compile(sol, '0.8.16', { context: this }).bytecode);
                let state = new State<Inst, Expr>();
                evm.run(0, state);

                while (state.last?.name === 'Jump') {
                    state = state.last.destBranch.state;
                }

                const stmt = state.stmts[0];
                expect(stmt.name, `Expected 'Log' but got '${stmt}'`).to.be.equal('Log');
                expect((<Log>stmt).args[0].eval()).to.be.deep.equal(sym);
            });
        });
    }
});
