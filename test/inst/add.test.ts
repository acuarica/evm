import { expect } from 'chai';
import { Stack, inst, ast } from '../../src';

describe('ADD', () => {
    it('should calculate `1 + 1`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        stack.push(1n);
        inst.MATH.ADD(stack);
        expect(stack.values).to.be.deep.equal([new ast.Add(1n, 1n)]);
    });

    it('should stringify `block.number + 1`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        stack.push(new ast.Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new ast.Symbol0('block.number'), 1n]);
        inst.MATH.ADD(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new ast.Add(new ast.Symbol0('block.number'), 1n));
        expect(stack.values[0].toString()).to.equal('block.number + 1');
    });
});
