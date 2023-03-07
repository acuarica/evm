import { expect } from 'chai';
import { Stack, inst, ast } from '../../src';
// import { Expr, Symbol0, Div, CallDataLoad, Shr, Val } from '../../src/ast';
// import { LOGIC } from '../../src/inst/logic';

describe('inst.EQ', () => {
    it('should calculate `1 == 1`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        stack.push(1n);
        inst.LOGIC.EQ(stack);
        expect(stack.values).to.deep.equal([1n]);
    });

    it('should calculate `1 == 2`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        stack.push(2n);
        inst.LOGIC.EQ(stack);
        expect(stack.values).to.be.deep.equal([0n]);
    });

    it('should stringify `block.number == 1`', () => {
        const stack = new Stack<ast.Expr>();
        stack.push(1n);
        stack.push(new ast.Symbol0('block.number'));
        expect(stack.values).to.be.deep.equal([new ast.Symbol0('block.number'), 1n]);

        inst.LOGIC.EQ(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0].toString()).to.be.equal('block.number == 1');
    });

    ['06fdde03', '12345678', '00000001'].forEach(hash => {
        describe(`EQ detect msg.sig for hash ${hash}`, () => {
            it('should stringify signature `msg.sig` from RHS DIV&EXP', () => {
                const stack = new Stack<ast.Expr>();
                stack.push(
                    new ast.Div(new ast.CallDataLoad(new ast.Val(0n)), new ast.Val(2n ** 0xe0n))
                );
                stack.push(new ast.Val(BigInt('0x' + hash)));
                inst.LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from LHS DIV&EXP', () => {
                const stack = new Stack<ast.Expr>();
                stack.push(new ast.Val(BigInt('0x' + hash)));
                stack.push(
                    new ast.Div(new ast.CallDataLoad(new ast.Val(0n)), new ast.Val(2n ** 0xe0n))
                );
                inst.LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from RHS SHR', () => {
                const stack = new Stack<ast.Expr>();
                stack.push(new ast.Shr(new ast.CallDataLoad(new ast.Val(0n)), new ast.Val(0xe0n)));
                stack.push(new ast.Val(BigInt('0x' + hash)));
                inst.LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });

            it('should stringify signature `msg.sig` from LHS SHR', () => {
                const stack = new Stack<ast.Expr>();
                stack.push(new ast.Val(BigInt('0x' + hash)));
                stack.push(new ast.Shr(new ast.CallDataLoad(new ast.Val(0n)), new ast.Val(0xe0n)));
                inst.LOGIC.EQ(stack);

                expect(stack.values).has.length(1);
                expect(stack.values[0].toString()).to.be.equal(`msg.sig == ${hash}`);
            });
        });
    });
});
