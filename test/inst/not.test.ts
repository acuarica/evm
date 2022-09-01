import { expect } from 'chai';
import { Stack } from '../../src';
import { LOGIC } from '../../src/inst/logic';
import { Operand } from '../../src/state';
import { Sym } from '../utils/evmtest';

describe('NOT', () => {
    it('should calculate `~1`', () => {
        const stack = new Stack<Operand>();
        stack.push(1n);
        expect(stack.values).to.deep.equal([1n]);
        LOGIC.NOT(stack);
        expect(stack.values).to.deep.equal([~1n]);
    });

    it('should stringify `~x`', () => {
        const stack = new Stack<Operand>();
        stack.push(new Sym());
        expect(stack.values).to.be.deep.equal([new Sym()]);
        LOGIC.NOT(stack);
        expect(stack.values).has.length(1);
        expect(stack.values[0].toString()).to.be.equal('~x');
    });
});
