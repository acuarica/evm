import { expect } from 'chai';
import { Stack } from '../../src';
import { LOGIC, Not } from '../../src/inst/logic';
import { Symbol0 } from '../../src/inst/symbols';
import { Expr } from '../../src/inst/utils';

describe('NOT', () => {
    it('should calculate `~1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        expect(stack.values).to.deep.equal([1n]);
        LOGIC.NOT(stack);
        expect(stack.values).to.deep.equal([~1n]);
    });

    it('should stringify `~block.number`', () => {
        const stack = new Stack<Expr>();
        stack.push(new Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new Symbol0('block.number')]);
        LOGIC.NOT(stack);
        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new Not(new Symbol0('block.number')));
        expect(stack.values[0].toString()).to.be.equal('~block.number');
    });
});
