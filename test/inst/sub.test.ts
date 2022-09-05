import { expect } from 'chai';
import { Stack } from '../../src';
import { MATH } from '../../src/inst/math';
import { Symbol0 } from '../../src/inst/symbols';
import { Expr } from '../../src/inst/utils';

describe('SUB', () => {
    it('should calculate `1 - 1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        stack.push(1n);
        expect(stack.values).to.be.deep.equal([1n, 1n]);
        MATH.SUB(stack);
        expect(stack.values).to.be.deep.equal([0n]);
    });

    it('should stringify `block.number - 1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        stack.push(new Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new Symbol0('block.number'), 1n]);
        MATH.SUB(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0].toString()).to.be.equal('block.number - 1');
    });
});
