import { expect } from 'chai';
import { type Expr, Val } from '../../src/evm/expr';
import { State, STEP } from 'sevm';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

describe('evm::stack', function () {
    describe('PUSHES', function () {
        it('should modify stack', function () {
            const one = new Uint8Array(1);
            one[0] = 1;
            const state = new State<never, Expr>();
            STEP().PUSH1(state, {
                offset: 0,
                pc: 0,
                opcode: 1,
                mnemonic: 'PUSH1',
                pushData: Buffer.from([1]),
            });
            expect(state.stack.values).to.deep.equal([new Val(1n, true)]);
        });
    });

    describe('DUPS', function () {
        [...Array(16).keys()]
            .map(i => i + 1)
            .forEach(size => {
                it(`should dup #${size - 1} element on the stack`, function () {
                    const state = new State<never, Expr>();
                    state.stack.push(new Val(2n));

                    const ignored = [];
                    for (let i = 1; i < size; i++) {
                        ignored.push(new Val(1n));
                        state.stack.push(new Val(1n));
                    }

                    STEP()[`DUP${size as Size}`](state);

                    expect(state.stack.values).to.deep.equal([
                        new Val(2n),
                        ...ignored,
                        new Val(2n),
                    ]);
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
        [...Array(16).keys()]
            .map(i => i + 1)
            .forEach(size => {
                it(`should swap #${size} element on the stack`, function () {
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
                        'Invalid swap operation'
                    );
                });
            });
    });
});
