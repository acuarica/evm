import { expect } from 'chai';
import util from 'util';

import { Add, Byte, IsZero, Lt, MLoad, Not, SLoad, Shl, Sig, Val } from 'sevm/ast';
import { Block, CallDataLoad, CallValue, DataCopy, Fn } from 'sevm/ast';
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
        const truncate = (str: string) => (str.length <= 100 ? str : str.slice(0, 100) + '[...]');

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

            {
                expr: Block.basefee,
                get children() {
                    return [];
                },
            },
            {
                expr: new Fn('BLOCKHASH', new Val(1234n)),
                get children() {
                    return [this.expr.value];
                },
            },
            {
                expr: new DataCopy('calldatacopy', new Val(0n), new Val(32n)),
                get children() {
                    return [this.expr.offset, this.expr.size];
                },
            },
            {
                expr: new DataCopy('extcodecopy', new Val(0n), new Val(32n), new Val(0x1234n)),
                get children() {
                    return [this.expr.offset, this.expr.size, this.expr.address];
                },
            },
            {
                expr: new CallValue(),
                get children() {
                    return [];
                },
            },
            {
                expr: new CallDataLoad(new Val(24n)),
                get children() {
                    return [this.expr.location];
                },
            },

            {
                expr: new SLoad(new Val(32n), {}),
                get children() {
                    return [this.expr.location];
                },
            },

            {
                expr: new Sha3(new Val(32n), new Val(64n)),
                get children() {
                    return [this.expr.offset, this.expr.size];
                },
            },
            {
                // TODO: ?
                expr: new Sha3(new Val(32n), new Val(64n), [new Val(1n), new Val(2n)]),
                get children() {
                    return [this.expr.offset, this.expr.size];
                },
            },
            {
                expr: new Create(new Val(100n), new Val(32n), new Val(128n)),
                get children() {
                    return [this.expr.value, this.expr.offset, this.expr.size];
                },
            },
            {
                expr: new Create(new Val(100n), new Val(32n), new Val(128n)),
                get children() {
                    return [this.expr.value, this.expr.offset, this.expr.size];
                },
            },
            {
                expr: new ReturnData(new Val(32n), new Val(128n)),
                get children() {
                    return [this.expr.retOffset, this.expr.retSize];
                },
            },
            {
                expr: new Create2(new Val(100n), new Val(32n), new Val(128n)),
                get children() {
                    return [this.expr.offset, this.expr.size, this.expr.value];
                },
            },
        ].forEach(({ expr, children }) => {
            it(truncate(util.inspect(expr, { breakLength: Infinity })), function () {
                expect(expr.children()).to.have.ordered.members(children);
            });
        });
    });
});
