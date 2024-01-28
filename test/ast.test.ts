import { expect } from 'chai';

import { Add, type Expr, Val, Props, MOD_256, Local } from 'sevm/ast';
import { Byte, IsZero, Lt, MLoad, Not, SLoad, Shl, Sig } from 'sevm/ast';
import { CallDataLoad, CallValue, DataCopy, Fn } from 'sevm/ast';
import { Create, Create2, ReturnData, Sha3 } from 'sevm/ast';

describe('::ast', function () {
    const wexpr = (expr: Expr, fn: (expr: Expr) => void) => fn(expr);

    it('should test `isVal`', function () {
        expect(new Val(0n).isVal()).to.be.true;
        expect(new Add(new Val(1n), new Val(2n)).isVal()).to.be.false;
    });

    it('should test `isZero`', function () {
        expect(new Val(0n).isZero()).to.be.true;
        expect(new Val(1n).isZero()).to.be.false;
        expect(new Add(new Val(0n), new Val(0n)).isZero()).to.be.false;
        expect(new Add(new Val(1n), new Val(2n)).isZero()).to.be.false;
    });

    it('should throw test `isVal`', function () {
        expect(() => new Val(-1n)).to.throw('Val is a not a valid unsigned 256-word: -1');
        expect(() => new Val(MOD_256)).to.throw('Val is a not a valid unsigned 256-word: ' + MOD_256.toString());
    });

    it('should \`unwrap\` expressions', function () {
        wexpr(new Val(0n), expr => expect(expr.unwrap()).to.be.equal(expr));
        wexpr(new Add(new Val(1n), new Local(1, new Val(2n, 10))), expr => expect(expr.unwrap()).to.be.equal(expr));

        const expr = new Local(1, new Val(2n, 10));
        expect(expr.unwrap()).to.be.equal(expr.value);
    });

    // it('should \`inline\` expressions', function () {
    //     wexpr(new Val(0n), expr => expect(expr.inline()).to.be.equal(expr));

    //     expect(new Add(new Val(1n), new Local(1, new Val(2n, 10))).inline())
    //         .to.be.deep.equal(new Add(new Val(1n), new Val(2n, 10)));

    //     const expr = new Add(new Val(1n), new Local(1, new Val(2n, 10))) as Add & { right: Local };
    //     expect((expr.inline() as Add).right).to.be.equal(expr.right.value);
    // });

    describe('children', function () {
        const t = <E>(expr: E, fn: (expr: E) => Expr[]) => [expr, fn(expr)] as const;

        [
            t(new Val(1n), () => []),
            t(new Add(new Val(1n), new Add(new Val(2n), new Val(3n))), expr => [expr.left, expr.right]),
            t(new Lt(new Val(1n), new Val(2n)), expr => [expr.left, expr.right]),
            t(new IsZero(new Val(0n)), expr => [expr.value]),
            t(new Not(new Val(0n)), expr => [expr.value]),
            t(new Byte(new Val(0n), new Val(32n)), expr => [expr.pos, expr.data]),
            t(new Shl(new Val(1n), new Val(32n)), expr => [expr.value, expr.shift]),
            t(new Sig('1234'), () => [],),

            t(new MLoad(new Val(32n)), expr => [expr.location]),

            t(Props['block.basefee'], () => []),
            t(new Fn('BLOCKHASH', new Val(1234n)), expr => [expr.value]),
            t(new DataCopy('calldatacopy', new Val(0n), new Val(32n)), expr => [expr.offset, expr.size]),
            t(new DataCopy('extcodecopy', new Val(0n), new Val(32n), new Val(0x1234n)), expr => [expr.offset, expr.size, expr.address!]),
            t(new CallValue(), () => []),
            t(new CallDataLoad(new Val(24n)), expr => [expr.location]),

            t(new SLoad(new Val(32n), undefined), expr => [expr.slot]),

            t(new Sha3(new Val(32n), new Val(64n)), expr => [expr.offset, expr.size]),
            t(new Sha3(new Val(32n), new Val(64n), [new Val(1n), new Val(2n)]), expr => [expr.offset, expr.size, expr.args![0], expr.args![1]]),
            t(new Create(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.value, expr.offset, expr.size]),
            t(new ReturnData(new Val(32n), new Val(128n)), expr => [expr.retOffset, expr.retSize]),
            t(new Create2(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.offset, expr.size, expr.value]),
        ].forEach(([expr, children]) => {
            it(`should get \`${expr.tag}\` ${children.length} children and from \`inline\``, function () {
                expect(expr.children()).to.have.ordered.members(children);

                // const exprI = expr.inline();
                // expect(exprI).to.be.deep.equal(expr);
                // expect(exprI.children()).to.have.deep.ordered.members(children);
            });
        });
    });
});
