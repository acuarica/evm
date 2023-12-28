import util from 'util';

import type { Operand, Shanghai } from 'sevm';
import type { Expr } from 'sevm/ast';
import { Add, Mul, Sub, Val, Div, Exp, Mod, Not, Eq, Sig, CallValue, CallDataLoad, Props, IsZero, Shl, Byte } from 'sevm/ast';

const id = <E>(expr: E): E => expr;

type FilterFn<T, F> = { [k in keyof T]: T[k] extends F ? k : never }[keyof T];

type StackStep = bigint | FilterFn<InstanceType<typeof Shanghai>, (state: Operand<Expr>) => void>;
const F = <E>(insts: StackStep[], expr: E, val: Expr | ((expr: E) => Expr), str: string, yulstr: string) => ({
    insts,
    expr,
    val: typeof val === 'function' ? val(expr) : val,
    str,
    yulstr,
});

export const truncate = (str: unknown, len = 50) =>
    (`${str}`.length <= len ? `${str}` : `${str}`.slice(0, len) + '[..]');

export const title = (obj: unknown) =>
    truncate(util.inspect(obj, { breakLength: Infinity }).replace(/ /g, ''));

export const $exprs = {
    core: [
        F([0xffn], new Val(0xffn), id, '0xff', '0xff'),
    ],
    alu: [
        F(['NUMBER', 15n, 'ADD'], new Add(new Val(15n), Props['block.number']), id, '0xf + block.number', 'add(0xf, number())'),
        F([2n, 1n, 'ADD'], new Add(new Val(1n), new Val(2n)), new Val(3n), '0x1 + 0x2', 'add(0x1, 0x2)'),
        F([2n, 1n, 'SUB'], new Sub(new Val(1n), new Val(2n)), new Val(-1n), '0x1 - 0x2', 'sub(0x1, 0x2)'),
        F([3n, 2n, 'ADD', 1n, 'ADD'], new Add(new Val(1n), new Add(new Val(2n), new Val(3n))), new Val(6n), '0x1 + 0x2 + 0x3', 'add(0x1, add(0x2, 0x3))'),
        F([3n, 5n, 'ADD', 2n, 'MUL'], new Mul(new Val(2n), new Add(new Val(5n), new Val(3n))), new Val(16n), '0x2 * (0x5 + 0x3)', 'mul(0x2, add(0x5, 0x3))'),
        F([3n, 5n, 'MUL', 2n, 'ADD'], new Add(new Val(2n), new Mul(new Val(5n), new Val(3n))), new Val(17n), '0x2 + 0x5 * 0x3', 'add(0x2, mul(0x5, 0x3))'),
        F([7n, 3n, 4n, 'ADD', 'SUB'], new Sub(new Add(new Val(4n), new Val(3n)), new Val(7n)), new Val(0n), '0x4 + 0x3 - 0x7', 'sub(add(0x4, 0x3), 0x7)'),
        F([3n, 4n, 'ADD', 7n, 'SUB'], new Sub(new Val(7n), new Add(new Val(4n), new Val(3n))), new Val(0n), '0x7 - 0x4 + 0x3', 'sub(0x7, add(0x4, 0x3))'),
        F([3n, 5n, 'ADD', 2n, 'DIV'], new Div(new Val(2n), new Add(new Val(5n), new Val(3n))), new Val(0n), '0x2 / (0x5 + 0x3)', 'div(0x2, add(0x5, 0x3))'),
        F([3n, 5n, 'DIV', 2n, 'ADD'], new Add(new Val(2n), new Div(new Val(5n), new Val(3n))), new Val(3n), '0x2 + 0x5 / 0x3', 'add(0x2, div(0x5, 0x3))'),
        F([0n, 3n, 'DIV'], new Div(new Val(3n), new Val(0n)), new Div(new Val(3n), new Val(0n)), '0x3 / 0x0', 'div(0x3, 0x0)'),
        F([2n, 3n, 'EXP', 1n, 'ADD'], new Add(new Val(1n), new Exp(new Val(3n), new Val(2n))), new Val(10n), '0x1 + 0x3 ** 0x2', 'add(0x1, exp(0x3, 0x2))'),
        F([3n, 1n, 'ADD', 2n, 'EXP'], new Exp(new Val(2n), new Add(new Val(1n), new Val(3n))), new Val(16n), '0x2 ** (0x1 + 0x3)', 'exp(0x2, add(0x1, 0x3))'),
        F([2n, 5n, 'MOD'], new Mod(new Val(5n), new Val(2n)), new Val(1n), '0x5 % 0x2', 'mod(0x5, 0x2)'),
        F([0n, 5n, 'MOD'], new Mod(new Val(5n), new Val(0n)), id, '0x5 % 0x0', 'mod(0x5, 0x0)'),

        F([2n, 3n, 'SUB', 'ISZERO'], new IsZero(new Sub(new Val(3n), new Val(2n))), new Val(0n), '(0x3 - 0x2) == 0', 'iszero(sub(0x3, 0x2))'),
        F([3n, 3n, 'SUB', 'ISZERO'], new IsZero(new Sub(new Val(3n), new Val(3n))), new Val(1n), '(0x3 - 0x3) == 0', 'iszero(sub(0x3, 0x3))'),
        F([0n, 'NOT'], new Not(new Val(0n)), new Val(BigInt('0x' + 'ff'.repeat(32))), '~0x0', 'not(0x0)'),
        F([1n, 'NOT'], new Not(new Val(1n)), new Val(BigInt('0x' + 'ff'.repeat(31) + 'fe')), '~0x1', 'not(0x1)'),
        F([2n, 3n, 'DIV', 'NOT'], new Not(new Div(new Val(3n), new Val(2n))), new Val(BigInt('0x' + 'ff'.repeat(31) + 'fe')), '~(0x3 / 0x2)', 'not(div(0x3, 0x2))'),
        F(['NUMBER', 'NOT'], new Not(Props['block.number']), id, '~block.number', 'not(number())'),
        F([1n, 1n, 'EQ'], new Val(1n), id, '0x1', '0x1'),
        F([1n, 2n, 'EQ'], new Val(0n), id, '0x0', '0x0'),
        F([1n, 'NUMBER', 'EQ'], new Eq(Props['block.number'], new Val(1n)), id, 'block.number == 0x1', 'eq(number(), 0x1)'),

        ...['06fdde03', '12345678', '00000001', '00000000'].map(selector =>
            [
                [2n ** 0xe0n, 0n, 'CALLDATALOAD', 'DIV', BigInt('0x' + selector), 'EQ'] satisfies StackStep[],
                [BigInt('0x' + selector), 2n ** 0xe0n, 0n, 'CALLDATALOAD', 'DIV', 'EQ'] satisfies StackStep[],
                [0n, 'CALLDATALOAD', 0xe0n, 'SHR', BigInt('0x' + selector), 'EQ'] satisfies StackStep[],
                [BigInt('0x' + selector), 0n, 'CALLDATALOAD', 0xe0n, 'SHR', 'EQ'] satisfies StackStep[],
            ].map(insts =>
                F(insts, new Sig(selector), id, `msg.sig == ${selector}`, `eq(msg.sig, ${selector})`)
            )
        ).flat(),

        F([2n, 3n, 'DIV', 1n, 'BYTE'], new Byte(new Val(1n), new Div(new Val(3n), new Val(2n))), new Val(0n), '(0x3 / 0x2 >> 0x1) & 1', 'byte(0x1, div(0x3, 0x2))'),
        F([2n, 3n, 'DIV', 2n, 'SHL'], new Shl(new Div(new Val(3n), new Val(2n)), new Val(2n)), new Val(4n), '0x3 / 0x2 << 0x2', 'shl(div(0x3, 0x2), 0x2)'),
    ],
    special: [
        F(['BASEFEE'], Props['block.basefee'], id, 'block.basefee', 'basefee()'),
        F(['CHAINID'], Props['block.chainid'], id, 'block.chainid', 'chainid()'),
        F(['COINBASE'], Props['block.coinbase'], id, 'block.coinbase', 'coinbase()'),
        F(['DIFFICULTY'], Props['block.difficulty'], id, 'block.difficulty', 'difficulty()'),
        F(['GASLIMIT'], Props['block.gaslimit'], id, 'block.gaslimit', 'gaslimit()'),
        F(['NUMBER'], Props['block.number'], id, 'block.number', 'number()'),
        F(['TIMESTAMP'], Props['block.timestamp'], id, 'block.timestamp', 'timestamp()'),
        F(['PREVRANDAO'], Props['block.prevrandao'], id, 'block.prevrandao', 'prevrandao()'),

        F(['CALLER'], Props['msg.sender'], id, 'msg.sender', 'caller()'),
        F(['CALLDATASIZE'], Props['msg.data.length'], id, 'msg.data.length', 'calldatasize()'),

        F(['ORIGIN'], Props['tx.origin'], id, 'tx.origin', 'origin()'),
        F(['GASPRICE'], Props['tx.gasprice'], id, 'tx.gasprice', 'gasprice()'),

        F(['CALLVALUE'], new CallValue(), id, 'msg.value', 'callvalue()'),

        F([0n, 'CALLDATALOAD'], new CallDataLoad(new Val(0n)), id, 'msg.data', 'calldataload(0x0)'),
        F([4n, 'CALLDATALOAD'], new CallDataLoad(new Val(4n)), id, '_arg0', 'calldataload(0x4)'),
        F([36n, 'CALLDATALOAD'], new CallDataLoad(new Val(36n)), id, '_arg1', 'calldataload(0x24)'),
        F([68n, 'CALLDATALOAD'], new CallDataLoad(new Val(68n)), id, '_arg2', 'calldataload(0x44)'),
        F([1n, 'CALLDATALOAD'], new CallDataLoad(new Val(1n)), id, 'msg.data[0x1]', 'calldataload(0x1)'),
        F([32n, 'CALLDATALOAD'], new CallDataLoad(new Val(32n)), id, 'msg.data[0x20]', 'calldataload(0x20)'),
        F([2n, 1n, 'ADD', 'CALLDATALOAD'], new CallDataLoad(new Add(new Val(1n), new Val(2n))), new CallDataLoad(new Val(3n)), 'msg.data[0x1 + 0x2]', 'calldataload(add(0x1, 0x2))'),
    ],
};