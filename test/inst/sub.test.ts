import { expect } from 'chai';
import { Stack, inst, ast } from '../../src';

describe('inst.SUB', () => {
    it('should calculate `1 - 1`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        stack.push(1n);
        expect(stack.values).to.be.deep.equal([1n, 1n]);
        inst.MATH.SUB(stack);
        expect(stack.values).to.be.deep.equal([0n]);
    });

    it('should stringify `block.number - 1`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        stack.push(new ast.Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new ast.Symbol0('block.number'), 1n]);
        inst.MATH.SUB(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0].toString()).to.be.equal('block.number - 1');
    });
});
