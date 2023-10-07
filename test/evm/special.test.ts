import { expect } from 'chai';

import { EVM, STEP, State, sol } from 'sevm';
import type { Expr, Inst, Log } from 'sevm/ast';
import { Add, Block, CallDataLoad, CallValue, Info, Msg, Tx, Val } from 'sevm/ast';

import { compile } from '../utils/solc';

describe('evm::special', function () {
    it(`should stringify Block's props`, function () {
        expect(sol`${Block.basefee}`).to.be.equal('block.basefee');
        expect(sol`${Block.chainid}`).to.be.equal('block.chainid');
        expect(sol`${Block.coinbase}`).to.be.equal('block.coinbase');
        expect(sol`${Block.difficulty}`).to.be.equal('block.difficulty');
        expect(sol`${Block.gaslimit}`).to.be.equal('block.gaslimit');
        expect(sol`${Block.number}`).to.be.equal('block.number');
        expect(sol`${Block.timestamp}`).to.be.equal('block.timestamp');
    });

    it(`should stringify Msg's props`, function () {
        expect(sol`${Msg.sender}`).to.be.equal('msg.sender');
        expect(sol`${Msg['data.length']}`).to.be.equal('msg.data.length');
    });

    it(`should stringify Tx's props`, function () {
        expect(sol`${Tx.origin}`).to.be.equal('tx.origin');
        expect(sol`${Tx.gasprice}`).to.be.equal('tx.gasprice');
    });

    it(`should push \`CallValue\``, function () {
        const state = new State<never, Expr>();
        STEP().CALLVALUE(state);

        expect(state.stack.values).to.deep.equal([new CallValue()]);
        expect(sol`${state.stack.values[0]}`).to.equal('msg.value');
    });

    describe('CallDataLoad', function () {
        [
            [new Val(0n), 'msg.data'] as const,
            [new Val(4n), '_arg0'] as const,
            [new Val(36n), '_arg1'] as const,
            [new Val(68n), '_arg2'] as const,
            [new Val(1n), 'msg.data[0x1]'] as const,
            [new Val(32n), 'msg.data[0x20]'] as const,
            [new Add(new Val(1n), new Val(2n)), 'msg.data[0x1 + 0x2]'] as const,
        ].forEach(([location, str]) => {
            it(`should push CallDataLoad \`${str}\` at \`:${sol`${location}`}\``, function () {
                const state = new State<never, Expr>();
                state.stack.push(location);
                STEP().CALLDATALOAD(state);

                expect(state.stack.values).to.deep.equal([new CallDataLoad(location)]);
                expect(sol`${state.stack.values[0]}`).to.equal(str);
            });
        });
    });

    for (const [mnemonic, sym] of Object.entries(Info)) {
        describe(`\`${sym.value}\` prop pushed from \`${mnemonic}\``, function () {
            it('should be well-formed', function () {
                expect(sol`${sym}`).to.be.equal(sym.value);
            });

            it('should get expr from stack', function () {
                const state = new State<never, Expr>();
                STEP()[mnemonic](state);

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

                const evm = new EVM(compile(sol, '0.8.16', this).bytecode);
                let state = new State<Inst, Expr>();
                evm.run(0, state);

                while (state.last?.name === 'Jump') {
                    state = state.last.destBranch.state;
                }

                const stmt = state.stmts[0];
                expect(stmt.name, `Expected 'Log' but got '${stmt}'`).to.be.equal('Log');
                expect((<Log>stmt).args![0].eval()).to.be.deep.equal(sym);
            });
        });
    }
});
