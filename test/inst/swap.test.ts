import { expect } from 'chai';
import { STACK, Stack } from '../../src';
import { Operand } from '../../src/state';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

describe('SWAP', () => {
    [...Array(16).keys()]
        .map(i => i + 1)
        .forEach(function (size) {
            it(`should swap #${size} element on the stack`, () => {
                const stack = new Stack<Operand>();
                stack.push(2n);

                const ignored = [];
                for (let i = 1; i < size; i++) {
                    ignored.push(1n);
                    stack.push(1n);
                }

                stack.push(3n);

                STACK()[`SWAP${size as Size}`](stack);

                expect(stack.values).to.deep.equal([2n, ...ignored, 3n]);
            });

            it(`should throw when #${size + 1} element is not present on the stack`, () => {
                const stack = new Stack<Operand>();

                for (let i = 1; i <= size; i++) {
                    stack.push(1n);
                }

                expect(() => STACK()[`SWAP${size as Size}`](stack)).to.throw(
                    'Invalid swap operation'
                );
            });
        });
});
