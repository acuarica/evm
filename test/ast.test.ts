import { expect } from 'chai';

import { Add, type Expr, Val, Props } from 'sevm/ast';
import { Byte, IsZero, Lt, MLoad, Not, SLoad, Shl, Sig } from 'sevm/ast';
import { CallDataLoad, CallValue, DataCopy, Fn } from 'sevm/ast';
import { Create, Create2, ReturnData, Sha3 } from 'sevm/ast';

describe('::ast', function () {
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

    describe('children', function () {
        const t = <E>(expr: E, fn: (expr: E) => Expr[]) => [expr, fn(expr)] as const;

        [
            t(new Val(1n), () => []),
            t(new Add(new Val(1n), new Val(2n)), expr => [expr.left, expr.right]),
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
            it(`should get \`${expr.tag}\` ${children.length} children`, function () {
                expect(expr.children()).to.have.ordered.members(children);
            });
        });
    });
});
