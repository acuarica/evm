import { expect } from 'chai';
import { Stack } from '../../src';
import { CallDataLoad } from '../../src/inst/info';
import { LOGIC, Shr } from '../../src/inst/logic';
import { Div } from '../../src/inst/math';
import { Operand } from '../../src/state';
import { Sym } from '../utils/evmtest';

describe('EQ', () => {
    it('should calculate `1 == 1`', () => {
        const stack = new Stack<Operand>();
        stack.push(1n);
        stack.push(1n);
        LOGIC.EQ(stack);
        expect(stack.values).to.deep.equal([1n]);
    });

    it('should calculate `1 == 2`', () => {
        const stack = new Stack<Operand>();
        stack.push(1n);
        stack.push(2n);
        LOGIC.EQ(stack);
        expect(stack.values).to.be.deep.equal([0n]);
    });

    it('should stringify `x == 1`', () => {
        const stack = new Stack<Operand>();
        stack.push(1n);
        stack.push(new Sym());
        expect(stack.values).to.be.deep.equal([new Sym(), 1n]);

        LOGIC.EQ(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0].toString()).to.be.equal('x == 1');
    });

    ['06fdde03', '12345678', '00000001'].forEach(hash => {
        describe(`EQ detect msg.sig for hash ${hash}`, () => {
            it('should stringify signature `msg.sig` from RHS DIV&EXP', () => {
                const stack = new Stack<Operand>();
                stack.push(new Div(new CallDataLoad(0n), 2n ** 0xe0n));
                stack.push(BigInt('0x' + hash));
                LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from LHS DIV&EXP', () => {
                const stack = new Stack<Operand>();
                stack.push(BigInt('0x' + hash));
                stack.push(new Div(new CallDataLoad(0n), 2n ** 0xe0n));
                LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from RHS SHR', () => {
                const stack = new Stack<Operand>();
                stack.push(new Shr(new CallDataLoad(0n), 0xe0n));
                stack.push(BigInt('0x' + hash));
                LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from LHS SHR', () => {
                const stack = new Stack<Operand>();
                stack.push(BigInt('0x' + hash));
                stack.push(new Shr(new CallDataLoad(0n), 0xe0n));
                LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });
        });
    });
});
