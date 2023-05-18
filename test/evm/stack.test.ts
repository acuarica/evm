import { expect } from 'chai';
import { type Expr, Val } from '../../src/evm/expr';
import { PUSHES, STACK } from '../../src/evm/stack';
import { Stack } from '../../src/state';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

describe('evm::stack', function () {
    describe('PUSHES', function () {
        it('should modify stack', function () {
            const one = new Uint8Array(1);
            one[0] = 1;
            const stack = new Stack<Expr>();
            PUSHES().PUSH1(Buffer.from([1]), stack);
            expect(stack.values).to.deep.equal([new Val(1n, true)]);
        });
    });

    describe('DUPS', function () {
        [...Array(16).keys()]
            .map(i => i + 1)
            .forEach(size => {
                it(`should dup #${size - 1} element on the stack`, function () {
                    const stack = new Stack<number>();
                    stack.push(2);

                    const ignored = [];
                    for (let i = 1; i < size; i++) {
                        ignored.push(1);
                        stack.push(1);
                    }

                    STACK<number>()[`DUP${size as Size}`](stack);

                    expect(stack.values).to.deep.equal([2, ...ignored, 2]);
                });

                it(`should throw when #${size} element is not present on the stack`, function () {
                    const stack = new Stack<number>();

                    for (let i = 1; i < size; i++) {
                        stack.push(1);
                    }

                    expect(() => STACK<number>()[`DUP${size as Size}`](stack)).to.throw(
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
                    const stack = new Stack<number>();
                    stack.push(2);

                    const ignored = [];
                    for (let i = 1; i < size; i++) {
                        ignored.push(1);
                        stack.push(1);
                    }

                    stack.push(3);

                    STACK<number>()[`SWAP${size as Size}`](stack);

                    expect(stack.values).to.deep.equal([2, ...ignored, 3]);
                });

                it(`should throw when #${
                    size + 1
                } element is not present on the stack`, function () {
                    const stack = new Stack<number>();

                    for (let i = 1; i <= size; i++) {
                        stack.push(1);
                    }

                    expect(() => STACK<number>()[`SWAP${size as Size}`](stack)).to.throw(
                        'Invalid swap operation'
                    );
                });
            });
    });
});
