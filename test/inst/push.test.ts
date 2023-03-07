import { expect } from 'chai';
import { Stack, ast, inst } from '../../src';

describe('PUSH', () => {
    it('should modify stack', () => {
        const one = new Uint8Array(1);
        one[0] = 1;
        const stack = new Stack<ast.Expr>();
        inst.PUSHES().PUSH1(one, stack);
        expect(stack.values).to.deep.equal([new ast.Val(1n)]);
    });
});
