import { expect } from 'chai';

import { sol, State, STEP } from 'sevm';
import { Val, type Expr, Local, Locali, type Inst, Block, Invalid } from 'sevm/ast';
import { $exprs } from './$exprs';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
const sizes = [...Array(16).keys()].map(i => i + 1);

describe('::step', function () {

    it('should retrieve halting insts', function () {
        expect(STEP().haltingInsts()).to.be.deep.equal(
            ['STOP', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT']
        );
    });

    it('should find decoder by opcode `number`', function () {
        const step = STEP();

        expect(step[0]).to.be.deep.equal([0, true, 'STOP']);
        expect(step[1]).to.be.deep.equal([0, false, 'ADD']);
        expect(step[0x60 + 32 - 1]).to.be.deep.equal([32, false, 'PUSH32']);
        expect(step[255]).to.be.deep.equal([0, true, 'SELFDESTRUCT']);
    });

    describe('stack', function () {
        describe('PUSHES', function () {
            it('should PUSH value onto stack', function () {
                const state = new State<never, Expr>();
                STEP().PUSH1(state, {
                    pc: 0,
                    opcode: 1,
                    mnemonic: 'PUSH1',
                    pushData: Buffer.from([1]),
                });
                expect(state.stack.values).to.deep.equal([new Val(1n, true)]);
            });
        });

        describe('DUPS', function () {
            sizes.forEach(size => {
                it(`should DUP #${size - 1} element on the stack`, function () {
                    const state = new State<never, Expr>();
                    state.stack.push(new Val(2n));

                    const ignored = [];
                    for (let i = 1; i < size; i++) {
                        ignored.push(new Val(1n));
                        state.stack.push(new Val(1n));
                    }

                    STEP()[`DUP${size as Size}`](state);

                    const local = new Local(0, new Val(2n));
                    expect(state.nlocals).to.be.equal(1);
                    expect(state.stmts).to.be.deep.equal([new Locali(local)]);
                    expect(state.stack.values).to.deep.equal([local, ...ignored, local]);
                });

                it(`should throw when #${size} element is not present on the stack`, function () {
                    const state = new State<never, Expr>();

                    for (let i = 1; i < size; i++) {
                        state.stack.push(new Val(1n));
                    }

                    expect(() => STEP()[`DUP${size as Size}`](state)).to.throw(
                        'Invalid duplication operation'
                    );
                });
            });
        });

        describe('SWAPS', function () {
            sizes.forEach(size => {
                it(`should SWAP #${size} element on the stack`, function () {
                    const state = new State<never, Expr>();
                    state.stack.push(new Val(2n));

                    const ignored = [];
                    for (let i = 1; i < size; i++) {
                        ignored.push(new Val(1n));
                        state.stack.push(new Val(1n));
                    }

                    state.stack.push(new Val(3n));

                    STEP()[`SWAP${size as Size}`](state);

                    expect(state.stack.values).to.deep.equal([
                        new Val(2n),
                        ...ignored,
                        new Val(3n),
                    ]);
                });

                it(`should throw when #${size + 1} elem is not present on the stack`, function () {
                    const state = new State<never, Expr>();

                    for (let i = 1; i <= size; i++) {
                        state.stack.push(new Val(1n));
                    }

                    expect(() => STEP()[`SWAP${size as Size}`](state)).to.throw(
                        'Position not found for swap operation'
                    );
                });
            });
        });
    });

    for (const [name, exprs] of Object.entries($exprs)) {
        describe(name, function () {
            exprs.forEach(({ insts, expr, str }) => {
                it(`should \`STEP\` \`[${insts.join('|')}]\` into \`${str}\``, function () {
                    const state = new State<never, Expr>();
                    for (const inst of insts) {
                        if (typeof inst === 'bigint') {
                            state.stack.push(new Val(inst));
                        } else {
                            STEP()[inst](state);
                        }
                    }

                    expect(state.stack.values).to.be.deep.equal([expr]);
                });
            });
        });
    }

    describe('MEMORY', function () {
        it('should MLOAD value onto stack', function () {
            const state = new State<Inst, Expr>();

            state.memory[4] = new Val(1n);
            state.stack.push(new Val(4n));
            STEP().MLOAD(state);

            expect(state.stack.values).to.be.deep.equal([new Val(1n)]);
        });

        it('should MSTORE value into memory', function () {
            const state = new State<Inst, Expr>();

            state.stack.push(Block.coinbase);
            state.stack.push(new Val(4n));
            STEP().MSTORE(state);

            expect(state.memory).to.be.deep.equal({ '4': Block.coinbase });
        });
    });

    describe('SYSTEM', function () {
        it('should halt when `INVALID` step', function () {
            const state = new State<Inst, Expr>();
            STEP().INVALID(state, { pc: 0, opcode: 1, mnemonic: 'INVALID', pushData: null });
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Invalid(1)]);
            expect(sol`${state.stmts[0]}`).to.be.equal("revert('Invalid instruction (0x1)');");
        });
    });

});
