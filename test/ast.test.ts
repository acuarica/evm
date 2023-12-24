import { expect } from 'chai';

import { Add, type Expr, Val, Props } from 'sevm/ast';
import { Byte, IsZero, Lt, MLoad, Not, SLoad, Shl, Sig } from 'sevm/ast';
import { CallDataLoad, CallValue, DataCopy, Fn } from 'sevm/ast';
import { Create, Create2, ReturnData, Sha3 } from 'sevm/ast';

import { $exprs, title } from './$exprs';

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
        const F = <E>(expr: E, fn: (expr: E) => Expr[]) => [expr, fn(expr)] as const;

        [
            F(new Val(1n), () => []),
            F(new Add(new Val(1n), new Val(2n)), expr => [expr.left, expr.right]),
            F(new Lt(new Val(1n), new Val(2n)), expr => [expr.left, expr.right]),
            F(new IsZero(new Val(0n)), expr => [expr.value]),
            F(new Not(new Val(0n)), expr => [expr.value]),
            F(new Byte(new Val(0n), new Val(32n)), expr => [expr.pos, expr.data]),
            F(new Shl(new Val(1n), new Val(32n)), expr => [expr.value, expr.shift]),
            F(new Sig('1234'), () => [],),

            F(new MLoad(new Val(32n)), expr => [expr.loc]),

            F(Props['block.basefee'], () => []),
            F(new Fn('BLOCKHASH', new Val(1234n)), expr => [expr.value]),
            F(new DataCopy('calldatacopy', new Val(0n), new Val(32n)), expr => [expr.offset, expr.size]),
            F(new DataCopy('extcodecopy', new Val(0n), new Val(32n), new Val(0x1234n)), expr => [expr.offset, expr.size, expr.address!]),
            F(new CallValue(), () => []),
            F(new CallDataLoad(new Val(24n)), expr => [expr.location]),

            F(new SLoad(new Val(32n), {}), expr => [expr.location]),

            F(new Sha3(new Val(32n), new Val(64n)), expr => [expr.offset, expr.size]),
            // TODO: ?
            F(new Sha3(new Val(32n), new Val(64n), [new Val(1n), new Val(2n)]), expr => [expr.offset, expr.size]),
            F(new Create(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.value, expr.offset, expr.size]),
            F(new Create(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.value, expr.offset, expr.size]),
            F(new ReturnData(new Val(32n), new Val(128n)), expr => [expr.retOffset, expr.retSize]),
            F(new Create2(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.offset, expr.size, expr.value]),
        ].forEach(([expr, children]) => {
            it(title(expr), function () {
                expect(expr.children()).to.have.ordered.members(children);
            });
        });
    });

    describe('eval', function () {
        Object.entries($exprs).forEach(([name, exprs]) => {
            describe(name, function () {
                exprs.forEach(({ expr, val, str }) => {
                    it(`should \`eval\` \`${str}\``, function () {
                        expect(expr.eval()).to.be.deep.equal(val);
                    });
                });
            });
        });
    });

});
