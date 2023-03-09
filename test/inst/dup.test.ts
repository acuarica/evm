import { expect } from 'chai';
import { Stack, inst, type ast } from '../../src';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

describe('inst.DUP', () => {
    [...Array(16).keys()]
        .map(i => i + 1)
        .forEach(size => {
            it(`should dup #${size - 1} element on the stack`, () => {
                const stack = new Stack<ast.Expr>();
                stack.push(2n);

                const ignored = [];
                for (let i = 1; i < size; i++) {
                    ignored.push(1n);
                    stack.push(1n);
                }

                inst.STACK[`DUP${size as Size}`](stack);

                expect(stack.values).to.deep.equal([2n, ...ignored, 2n]);
            });

            it(`should throw when #${size} element is not present on the stack`, () => {
                const stack = new Stack<ast.Expr>();

                for (let i = 1; i < size; i++) {
                    stack.push(1n);
                }

                expect(() => inst.STACK[`DUP${size as Size}`](stack)).to.throw(
                    'Invalid duplication operation'
                );
            });
        });
});
