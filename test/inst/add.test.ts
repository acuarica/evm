import { expect } from 'chai';
import { Stack } from '../../src';
import { Add, Expr, Symbol0 } from '../../src/ast';
import { MATH } from '../../src/inst/math';

describe('ADD', () => {
    it('should calculate `1 + 1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        stack.push(1n);
        MATH.ADD(stack);
        expect(stack.values).to.be.deep.equal([2n]);
    });

    it('should stringify `block.number + 1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        stack.push(new Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new Symbol0('block.number'), 1n]);
        MATH.ADD(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new Add(new Symbol0('block.number'), 1n));
        expect(stack.values[0].toString()).to.equal('block.number + 1');
    });
});
