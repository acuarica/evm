import { expect } from 'chai';
import { Stack } from '../../src';
import { MATH } from '../../src/inst/math';
import { Operand } from '../../src/state';
import { Sym } from '../utils/evmtest';

describe('ADD', () => {
    it('should calculate `1 + 1`', () => {
        const stack = new Stack<Operand>();
        stack.push(1n);
        stack.push(1n);
        MATH.ADD(stack);
        expect(stack.values).to.be.deep.equal([2n]);
    });

    it('should stringify `x + 1`', () => {
        const stack = new Stack<Operand>();
        stack.push(1n);
        stack.push(new Sym());
        expect(stack.values).to.be.deep.equal([new Sym(), 1n]);
        MATH.ADD(stack);
        expect(stack.values).has.length(1);
        expect(stack.values[0].toString()).to.equal('x + 1');
    });
});
