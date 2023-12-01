import { expect } from 'chai';
import util from 'util';

import { Add, Byte, IsZero, Lt, MLoad, Not, Shl, Sig, Val } from 'sevm/ast';

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
        [
            { expr: new Val(1n), children: [] },

            {
                expr: new Add(new Val(1n), new Val(2n)),
                get children() {
                    return [this.expr.left, this.expr.right];
                },
            },

            {
                expr: new Lt(new Val(1n), new Val(2n)),
                get children() {
                    return [this.expr.left, this.expr.right];
                },
            },
            {
                expr: new IsZero(new Val(0n)),
                get children() {
                    return [this.expr.value];
                },
            },
            {
                expr: new Not(new Val(0n)),
                get children() {
                    return [this.expr.value];
                },
            },
            {
                expr: new Byte(new Val(0n), new Val(32n)),
                get children() {
                    return [this.expr.pos, this.expr.data];
                },
            },
            {
                expr: new Shl(new Val(1n), new Val(32n)),
                get children() {
                    return [this.expr.value, this.expr.shift];
                },
            },
            {
                expr: new Sig('1234'),
                get children() {
                    return [];
                },
            },

            {
                expr: new MLoad(new Val(32n)),
                get children() {
                    return [this.expr.loc];
                },
            },
        ].forEach(({ expr, children }) => {
            it(util.inspect(expr, { breakLength: Infinity }), function () {
                expect(expr.children()).to.have.ordered.members(children);
            });
        });
    });
});
