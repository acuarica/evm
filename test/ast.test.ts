import { expect } from 'chai';
import util from 'util';

import { Add, type Expr, Val, Sub, Mul, Div, Exp, Mod } from 'sevm/ast';
import { Byte, IsZero, Lt, MLoad, Not, SLoad, Shl, Sig } from 'sevm/ast';
import { Block, CallDataLoad, CallValue, DataCopy, Fn } from 'sevm/ast';
import { Create, Create2, ReturnData, Sha3 } from 'sevm/ast';

const F = <E, T>(insts: T, expr: E, fn: (expr: E) => Expr, str: string) => ({
    insts,
    expr,
    val: fn(expr),
    str,
});

// eslint-disable-next-line mocha/no-exports
export const mathExprs = [
    F(
        ['NUMBER', 15, 'ADD'] as const,
        new Add(new Val(15n), Block.number),
        expr => expr,
        '0xf + block.number'
    ),
    {
        insts: [2, 1, 'ADD'] as const,
        expr: new Add(new Val(1n), new Val(2n)),
        val: new Val(3n),
        str: '0x1 + 0x2',
    },
    {
        insts: [2, 1, 'SUB'] as const,
        expr: new Sub(new Val(1n), new Val(2n)),
        val: new Val(-1n),
        str: '0x1 - 0x2',
    },
    {
        insts: [3, 2, 'ADD', 1, 'ADD'] as const,
        expr: new Add(new Val(1n), new Add(new Val(2n), new Val(3n))),
        val: new Val(6n),
        str: '0x1 + 0x2 + 0x3',
    },
    {
        insts: [3, 5, 'ADD', 2, 'MUL'] as const,
        expr: new Mul(new Val(2n), new Add(new Val(5n), new Val(3n))),
        val: new Val(16n),
        str: '0x2 * (0x5 + 0x3)',
    },
    {
        insts: [3, 5, 'MUL', 2, 'ADD'] as const,
        expr: new Add(new Val(2n), new Mul(new Val(5n), new Val(3n))),
        val: new Val(17n),
        str: '0x2 + 0x5 * 0x3',
    },
    {
        insts: [7, 3, 4, 'ADD', 'SUB'] as const,
        expr: new Sub(new Add(new Val(4n), new Val(3n)), new Val(7n)),
        val: new Val(0n),
        str: '0x4 + 0x3 - 0x7',
    },
    {
        insts: [3, 4, 'ADD', 7, 'SUB'] as const,
        expr: new Sub(new Val(7n), new Add(new Val(4n), new Val(3n))),
        val: new Val(0n),
        str: '0x7 - 0x4 + 0x3',
    },
    {
        insts: [3, 5, 'ADD', 2, 'DIV'] as const,
        expr: new Div(new Val(2n), new Add(new Val(5n), new Val(3n))),
        val: new Val(0n),
        str: '0x2 / (0x5 + 0x3)',
    },
    {
        insts: [3, 5, 'DIV', 2, 'ADD'] as const,
        expr: new Add(new Val(2n), new Div(new Val(5n), new Val(3n))),
        val: new Val(3n),
        str: '0x2 + 0x5 / 0x3',
    },
    {
        insts: [0, 3, 'DIV'] as const,
        expr: new Div(new Val(3n), new Val(0n)),
        val: new Div(new Val(3n), new Val(0n)),
        str: '0x3 / 0x0',
    },
    {
        insts: [2, 3, 'EXP', 1, 'ADD'] as const,
        expr: new Add(new Val(1n), new Exp(new Val(3n), new Val(2n))),
        val: new Val(10n),
        str: '0x1 + 0x3 ** 0x2',
    },
    {
        insts: [3, 1, 'ADD', 2, 'EXP'] as const,
        expr: new Exp(new Val(2n), new Add(new Val(1n), new Val(3n))),
        val: new Val(16n),
        str: '0x2 ** (0x1 + 0x3)',
    },
    {
        insts: [2, 5, 'MOD'] as const,
        expr: new Mod(new Val(5n), new Val(2n)),
        val: new Val(1n),
        str: '0x5 % 0x2',
    },
    {
        insts: [0, 5, 'MOD'] as const,
        expr: new Mod(new Val(5n), new Val(0n)),
        get val() {
            return this.expr;
        },
        str: '0x5 % 0x0',
    },
];

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
        const truncate = (str: string) => (str.length <= 100 ? str : str.slice(0, 100) + '[...]');

        // prettier-ignore
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

            F(Block.basefee, () => []),
            F(new Fn('BLOCKHASH', new Val(1234n)), expr => [expr.value]),
            F(new DataCopy('calldatacopy', new Val(0n), new Val(32n)), expr => [expr.offset, expr.size]),
            F(new DataCopy('extcodecopy', new Val(0n), new Val(32n), new Val(0x1234n)), expr => [expr.offset, expr.size, expr.address!]),
            F(new CallValue(), () => []),
            F(new CallDataLoad(new Val(24n)), expr => [expr.location]),

            F(new SLoad(new Val(32n), {}), expr=>[expr.location]),

            F(new Sha3(new Val(32n), new Val(64n)), expr=>[expr.offset, expr.size]),
            // TODO: ?
            F(new Sha3(new Val(32n), new Val(64n), [new Val(1n), new Val(2n)]), expr => [expr.offset, expr.size]),
            F(new Create(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.value, expr.offset, expr.size]),
            F(new Create(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.value, expr.offset, expr.size]),
            F(new ReturnData(new Val(32n), new Val(128n)), expr => [expr.retOffset, expr.retSize]),
            F(new Create2(new Val(100n), new Val(32n), new Val(128n)), expr => [expr.offset, expr.size, expr.value]),
        ].forEach(([ expr, children ]) => {
            it(truncate(util.inspect(expr, { breakLength: Infinity })), function () {
                expect(expr.children()).to.have.ordered.members(children);
            });
        });
    });

    describe('eval', function () {
        mathExprs.forEach(({ expr, val, str }) => {
            it(`should \`eval\` \`${str}\``, function () {
                expect(expr.eval()).to.be.deep.equal(val);
            });
        });
    });
});
