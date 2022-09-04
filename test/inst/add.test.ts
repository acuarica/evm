import { expect } from 'chai';
import { Stack } from '../../src';
import { Add, MATH } from '../../src/inst/math';
import { Expr } from '../../src/inst/utils';
import { Sym } from '../utils/evmtest';

describe('ADD', () => {
    it('should calculate `1 + 1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        stack.push(1n);
        MATH.ADD(stack);
        expect(stack.values).to.be.deep.equal([2n]);
    });

    it('should stringify `x + 1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        stack.push(new Sym('x'));
        expect(stack.values).to.be.deep.equal([new Sym('x'), 1n]);
        MATH.ADD(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new Add(new Sym('x'), 1n));
        expect(stack.values[0].toString()).to.equal('x + 1');
    });
});
