import { expect } from 'chai';
import { Stack } from '../../src';
import { LOGIC, Not } from '../../src/inst/logic';
import { Expr } from '../../src/inst/utils';
import { Sym } from '../utils/evmtest';

describe('NOT', () => {
    it('should calculate `~1`', () => {
        const stack = new Stack<Expr>();
        stack.push(1n);
        expect(stack.values).to.deep.equal([1n]);
        LOGIC.NOT(stack);
        expect(stack.values).to.deep.equal([~1n]);
    });

    it('should stringify `~x`', () => {
        const stack = new Stack<Expr>();
        stack.push(new Sym('x'));
        expect(stack.values).to.be.deep.equal([new Sym('x')]);
        LOGIC.NOT(stack);
        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new Not(new Sym('x')));
        expect(stack.values[0].toString()).to.be.equal('~x');
    });
});
