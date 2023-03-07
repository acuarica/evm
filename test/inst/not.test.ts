import { expect } from 'chai';
import { Stack, inst, ast } from '../../src';

describe('inst.NOT', () => {
    it('should calculate `~1`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        expect(stack.values).to.deep.equal([1n]);
        inst.LOGIC.NOT(stack);
        expect(stack.values).to.deep.equal([~1n]);
    });

    it('should stringify `~block.number`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(new ast.Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new ast.Symbol0('block.number')]);
        inst.LOGIC.NOT(stack);
        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new ast.Not(new ast.Symbol0('block.number')));
        expect(stack.values[0].toString()).to.be.equal('~block.number');
    });
});
