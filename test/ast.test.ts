import { expect } from 'chai';
import util from 'util';

import type { PUSHES, Step } from 'sevm';

import { Add, type Expr, Val, Sub, Mul, Div, Exp, Mod, Eq, Msg, Tx } from 'sevm/ast';
import { Byte, IsZero, Lt, MLoad, Not, SLoad, Shl, Sig } from 'sevm/ast';
import { Block, CallDataLoad, CallValue, DataCopy, Fn } from 'sevm/ast';
import { Create, Create2, ReturnData, Sha3 } from 'sevm/ast';

const id = <E>(expr: E): E => expr;

type StackStep =
    | bigint
    | Exclude<keyof Step, 'PC' | 'INVALID' | 'JUMP' | 'JUMPI' | keyof typeof PUSHES>;
const F = <E>(insts: StackStep[], expr: E, val: Expr | ((expr: E) => Expr), str: string) => ({
    insts,
    expr,
    val: typeof val === 'function' ? val(expr) : val,
    str,
});

const truncate = (str: string) => (str.length <= 100 ? str : str.slice(0, 100) + '[...]');
// eslint-disable-next-line mocha/no-exports
export const title = (obj: unknown) => truncate(util.inspect(obj, { breakLength: Infinity }));

// prettier-ignore
// eslint-disable-next-line mocha/no-exports
export const $exprs = {
    math: [
        F(['NUMBER', 15n, 'ADD'], new Add(new Val(15n), Block.number), id, '0xf + block.number'),
        F([2n, 1n, 'ADD'], new Add(new Val(1n), new Val(2n)), new Val(3n), '0x1 + 0x2'),
        F([2n, 1n, 'SUB'], new Sub(new Val(1n), new Val(2n)), new Val(-1n), '0x1 - 0x2'),
        F([3n, 2n, 'ADD', 1n, 'ADD'], new Add(new Val(1n), new Add(new Val(2n), new Val(3n))), new Val(6n), '0x1 + 0x2 + 0x3'),
        F([3n, 5n, 'ADD', 2n, 'MUL'], new Mul(new Val(2n), new Add(new Val(5n), new Val(3n))), new Val(16n), '0x2 * (0x5 + 0x3)'),
        F([3n, 5n, 'MUL', 2n, 'ADD'], new Add(new Val(2n), new Mul(new Val(5n), new Val(3n))), new Val(17n), '0x2 + 0x5 * 0x3'),
        F([7n, 3n, 4n, 'ADD', 'SUB'], new Sub(new Add(new Val(4n), new Val(3n)), new Val(7n)), new Val(0n), '0x4 + 0x3 - 0x7'),
        F([3n, 4n, 'ADD', 7n, 'SUB'], new Sub(new Val(7n), new Add(new Val(4n), new Val(3n))), new Val(0n), '0x7 - 0x4 + 0x3'),
        F([3n, 5n, 'ADD', 2n, 'DIV'], new Div(new Val(2n), new Add(new Val(5n), new Val(3n))), new Val(0n), '0x2 / (0x5 + 0x3)'),
        F([3n, 5n, 'DIV', 2n, 'ADD'], new Add(new Val(2n), new Div(new Val(5n), new Val(3n))), new Val(3n), '0x2 + 0x5 / 0x3'),
        F([0n, 3n, 'DIV'], new Div(new Val(3n), new Val(0n)), new Div(new Val(3n), new Val(0n)), '0x3 / 0x0'),
        F([2n, 3n, 'EXP', 1n, 'ADD'], new Add(new Val(1n), new Exp(new Val(3n), new Val(2n))), new Val(10n), '0x1 + 0x3 ** 0x2'),
        F([3n, 1n, 'ADD', 2n, 'EXP'], new Exp(new Val(2n), new Add(new Val(1n), new Val(3n))), new Val(16n), '0x2 ** (0x1 + 0x3)'),
        F([2n, 5n, 'MOD'], new Mod(new Val(5n), new Val(2n)), new Val(1n), '0x5 % 0x2'),
        F([0n, 5n, 'MOD'], new Mod(new Val(5n), new Val(0n)), id, '0x5 % 0x0'),
    ],
    logic: [
        F([0n, 'NOT'], new Not(new Val(BigInt(0))), new Val(BigInt('0x' + 'ff'.repeat(32))), '~0x0'),
        F([1n, 'NOT'], new Not(new Val(BigInt(1))), new Val(BigInt('0x' + 'ff'.repeat(31) + 'fe')), '~0x1'),
        F(['NUMBER', 'NOT'], new Not(Block.number), id, '~block.number'),
        F([1n, 1n, 'EQ'], new Val(1n), id, '0x1'),
        F([1n, 2n, 'EQ'], new Val(0n), id, '0x0'),
        F([1n, 'NUMBER', 'EQ'], new Eq(Block.number, new Val(1n)), id, 'block.number == 0x1'),

        ...['06fdde03', '12345678', '00000001', '00000000'].map(selector =>
            [
                [2n ** 0xe0n, 0n, 'CALLDATALOAD', 'DIV', BigInt('0x' + selector), 'EQ'] satisfies StackStep[],
                [BigInt('0x' + selector), 2n ** 0xe0n, 0n, 'CALLDATALOAD', 'DIV', 'EQ'] satisfies StackStep[],
                [0n, 'CALLDATALOAD', 0xe0n, 'SHR', BigInt('0x' + selector), 'EQ'] satisfies StackStep[],
                [BigInt('0x' + selector), 0n, 'CALLDATALOAD', 0xe0n, 'SHR', 'EQ'] satisfies StackStep[],
            ].map(insts =>
                F(insts, new Sig(selector), id, `msg.sig == ${selector}`)
            )
        ).flat(),
    ],
    special: [
        F(['BASEFEE'], Block.basefee, id, 'block.basefee'),
        F(['CHAINID'], Block.chainid, id, 'block.chainid'),
        F(['COINBASE'], Block.coinbase, id, 'block.coinbase'),
        F(['DIFFICULTY'], Block.difficulty, id, 'block.difficulty'),
        F(['GASLIMIT'], Block.gaslimit, id, 'block.gaslimit'),
        F(['NUMBER'], Block.number, id, 'block.number'),
        F(['TIMESTAMP'], Block.timestamp, id, 'block.timestamp'),

        F(['CALLER'], Msg.sender, id, 'msg.sender'),
        F(['CALLDATASIZE'], Msg['data.length'], id, 'msg.data.length'),

        F(['ORIGIN'], Tx.origin, id, 'tx.origin'),
        F(['GASPRICE'], Tx.gasprice, id, 'tx.gasprice'),

        F(['CALLVALUE'], new CallValue(), id, 'msg.value'),

        F([0n, 'CALLDATALOAD'], new CallDataLoad(new Val(0n)), id, 'msg.data'),
        F([4n, 'CALLDATALOAD'], new CallDataLoad(new Val(4n)), id, '_arg0'),
        F([36n, 'CALLDATALOAD'], new CallDataLoad(new Val(36n)), id, '_arg1'),
        F([68n, 'CALLDATALOAD'], new CallDataLoad(new Val(68n)), id, '_arg2'),
        F([1n, 'CALLDATALOAD'], new CallDataLoad(new Val(1n)), id, 'msg.data[0x1]'),
        F([32n, 'CALLDATALOAD'], new CallDataLoad(new Val(32n)), id, 'msg.data[0x20]'),
        F([2n, 1n, 'ADD', 'CALLDATALOAD'], new CallDataLoad(new Add(new Val(1n), new Val(2n))), new CallDataLoad(new Val(3n)), 'msg.data[0x1 + 0x2]'),
    ],
};

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
        for (const [name, exprs] of Object.entries($exprs)) {
            describe(name, function () {
                exprs.forEach(({ expr, val, str }) => {
                    it(`should \`eval\` \`${str}\``, function () {
                        expect(expr.eval()).to.be.deep.equal(val);
                    });
                });
            });
        }
    });
});
