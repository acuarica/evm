import { expect } from 'chai';
import { type Expr, Val } from '../../src/evm/def';
import { CallDataLoad } from '../../src/evm/info';
import { LOGIC, Not, Shr } from '../../src/evm/logic';
import { Div } from '../../src/evm/math';
import { Symbol0 } from '../../src/evm/sym';
import { Stack } from '../../src/state';

describe('evm::logic::', () => {
    it.skip('should calculate `~1`', () => {
        const stack = new Stack<Expr>();
        stack.push(new Val(1n));
        LOGIC.NOT(stack);

        expect(stack.values).to.deep.equal([new Val(~1n)]);
    });

    it.skip('should stringify `~block.number`', () => {
        const stack = new Stack<Expr>();
        stack.push(new Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new Symbol0('block.number')]);
        LOGIC.NOT(stack);
        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new Not(new Symbol0('block.number')));
        expect(stack.values[0].str()).to.be.equal('~block.number');
    });

    describe('EQ', () => {
        // it('should calculate `1 == 1`', () => {
        //     const stack = new Stack<Expr>();
        //     stack.push(1n);
        //     stack.push(1n);
        //     LOGIC.EQ(stack);
        //     expect(stack.values).to.deep.equal([1n]);
        // });

        // it('should calculate `1 == 2`', () => {
        //     const stack = new Stack<Expr>();
        //     stack.push(1n);
        //     stack.push(2n);
        //     inst.LOGIC.EQ(stack);
        //     expect(stack.values).to.be.deep.equal([0n]);
        // });

        // it('should stringify `block.number == 1`', () => {
        //     const stack = new Stack<ast.Expr>();
        //     stack.push(1n);
        //     stack.push(new ast.Symbol0('block.number'));
        //     expect(stack.values).to.be.deep.equal([new ast.Symbol0('block.number'), 1n]);

        //     inst.LOGIC.EQ(stack);

        //     expect(stack.values).has.length(1);
        //     expect(stack.values[0].toString()).to.be.equal('block.number == 1');
        // });

        ['06fdde03', '12345678', '00000001'].forEach(hash => {
            describe(`EQ detect msg.sig for hash ${hash}`, () => {
                it('should stringify signature `msg.sig` from RHS DIV&EXP', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Div(new CallDataLoad(new Val(0n)), new Val(2n ** 0xe0n)));
                    stack.push(new Val(BigInt('0x' + hash)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.equal(`msg.sig == ${hash}`);
                });

                it('should stringify signature `msg.sig` from LHS DIV&EXP', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Val(BigInt('0x' + hash)));
                    stack.push(new Div(new CallDataLoad(new Val(0n)), new Val(2n ** 0xe0n)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.be.equal(`msg.sig == ${hash}`);
                });

                it('should stringify signature `msg.sig` from RHS SHR', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Shr(new CallDataLoad(new Val(0n)), new Val(0xe0n)));
                    stack.push(new Val(BigInt('0x' + hash)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.be.equal(`msg.sig == ${hash}`);
                });

                it('should stringify signature `msg.sig` from LHS SHR', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Val(BigInt('0x' + hash)));
                    stack.push(new Shr(new CallDataLoad(new Val(0n)), new Val(0xe0n)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.be.equal(`msg.sig == ${hash}`);
                });
            });
        });
    });
});
