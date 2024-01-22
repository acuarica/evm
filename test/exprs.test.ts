import { expect } from 'chai';
import util from 'util';

import { Shanghai, sol, yul, type Ram, State } from 'sevm';
import type { Expr } from 'sevm/ast';
import { Add, Byte, CallDataLoad, CallValue, Div, Eq, Exp, IsZero, MLoad, Mod, Mul, Not, Prop, Props, Sha3, Shl, Sig, Sub, Val } from 'sevm/ast';

const id = <E>(expr: E): E => expr;

type FilterFn<T, F> = { [k in keyof T]: T[k] extends F ? k : never }[keyof T];

type StackStep = bigint | FilterFn<InstanceType<typeof Shanghai>, (state: Ram<Expr>) => void>;
const t = <E>(insts: StackStep[], expr: E, val: Expr | ((expr: E) => Expr), solstr: string, yulstr: string, memory: Ram<Expr>['memory'] = {}) => ({
    insts,
    expr,
    val: typeof val === 'function' ? val(expr) : val,
    solstr,
    yulstr,
    memory,
});

const trunc = (str: bigint | string, len = 80) =>
    (`${str}`.length <= len ? `${str}` : `${str}`.slice(0, len) + '[..]');

const title = (obj: unknown) =>
    trunc(util.inspect(obj, { breakLength: Infinity }).replace(/ /g, ''));

const MAX_WORD = (1n << 0x100n) - 1n;

const $exprs = {
    core: [
        t([0xffn], new Val(0xffn), id, '0xff', '0xff'),
        ...[
            `0x${'ff'.repeat(32)}`,
            `0x${'ff'.repeat(31)}fe`
        ].map(n => t([BigInt(n)], new Val(BigInt(n)), id, n, n)),
    ],
    alu: [
        t(['NUMBER', 15n, 'ADD'], new Add(new Val(15n), Props['block.number']), id, '0xf + block.number', 'add(0xf, number())'),
        t([2n, 1n, 'ADD'], new Add(new Val(1n), new Val(2n)), new Val(3n), '0x1 + 0x2', 'add(0x1, 0x2)'),
        t([MAX_WORD, 3n, 'ADD'], new Add(new Val(3n), new Val(MAX_WORD)), new Val(2n), `0x3 + 0x${'ff'.repeat(32)}`, `add(0x3, 0x${'ff'.repeat(32)})`),
        t([MAX_WORD + 2n, 3n, 'ADD'], new Add(new Val(3n), new Val(MAX_WORD + 2n)), new Val(4n), `0x3 + 0x1${'00'.repeat(31)}01`, `add(0x3, 0x1${'00'.repeat(31)}01)`),
        t(
            [0x1fn, 'NOT', 0x80n, 0xb4n, 'SUB', 'ADD'],
            new Add(new Sub(new Val(0xb4n), new Val(0x80n)), new Not(new Val(0x1fn))),
            new Val(0x14n),
            '0xb4 - 0x80 + ~0x1f',
            'add(sub(0xb4, 0x80), not(0x1f))'
        ),

        t([2n, 1n, 'SUB'], new Sub(new Val(1n), new Val(2n)), new Val(MAX_WORD), '0x1 - 0x2', 'sub(0x1, 0x2)'),
        t([3n, 2n, 'ADD', 1n, 'ADD'], new Add(new Val(1n), new Add(new Val(2n), new Val(3n))), new Val(6n), '0x1 + 0x2 + 0x3', 'add(0x1, add(0x2, 0x3))'),
        t([3n, 5n, 'ADD', 2n, 'MUL'], new Mul(new Val(2n), new Add(new Val(5n), new Val(3n))), new Val(16n), '0x2 * (0x5 + 0x3)', 'mul(0x2, add(0x5, 0x3))'),
        t([3n, 5n, 'MUL', 2n, 'ADD'], new Add(new Val(2n), new Mul(new Val(5n), new Val(3n))), new Val(17n), '0x2 + 0x5 * 0x3', 'add(0x2, mul(0x5, 0x3))'),
        t([7n, 3n, 4n, 'ADD', 'SUB'], new Sub(new Add(new Val(4n), new Val(3n)), new Val(7n)), new Val(0n), '0x4 + 0x3 - 0x7', 'sub(add(0x4, 0x3), 0x7)'),
        t([3n, 4n, 'ADD', 7n, 'SUB'], new Sub(new Val(7n), new Add(new Val(4n), new Val(3n))), new Val(0n), '0x7 - 0x4 + 0x3', 'sub(0x7, add(0x4, 0x3))'),
        t([3n, 5n, 'ADD', 2n, 'DIV'], new Div(new Val(2n), new Add(new Val(5n), new Val(3n))), new Val(0n), '0x2 / (0x5 + 0x3)', 'div(0x2, add(0x5, 0x3))'),
        t([3n, 5n, 'DIV', 2n, 'ADD'], new Add(new Val(2n), new Div(new Val(5n), new Val(3n))), new Val(3n), '0x2 + 0x5 / 0x3', 'add(0x2, div(0x5, 0x3))'),
        t([0n, 3n, 'DIV'], new Div(new Val(3n), new Val(0n)), new Div(new Val(3n), new Val(0n)), '0x3 / 0x0', 'div(0x3, 0x0)'),
        t([2n, 3n, 'EXP', 1n, 'ADD'], new Add(new Val(1n), new Exp(new Val(3n), new Val(2n))), new Val(10n), '0x1 + 0x3 ** 0x2', 'add(0x1, exp(0x3, 0x2))'),
        t([3n, 1n, 'ADD', 2n, 'EXP'], new Exp(new Val(2n), new Add(new Val(1n), new Val(3n))), new Val(16n), '0x2 ** (0x1 + 0x3)', 'exp(0x2, add(0x1, 0x3))'),
        t([2n, 5n, 'MOD'], new Mod(new Val(5n), new Val(2n)), new Val(1n), '0x5 % 0x2', 'mod(0x5, 0x2)'),
        t([0n, 5n, 'MOD'], new Mod(new Val(5n), new Val(0n)), id, '0x5 % 0x0', 'mod(0x5, 0x0)'),

        t([2n, 3n, 'SUB', 'ISZERO'], new IsZero(new Sub(new Val(3n), new Val(2n))), new Val(0n), '(0x3 - 0x2) == 0', 'iszero(sub(0x3, 0x2))'),
        t([3n, 3n, 'SUB', 'ISZERO'], new IsZero(new Sub(new Val(3n), new Val(3n))), new Val(1n), '(0x3 - 0x3) == 0', 'iszero(sub(0x3, 0x3))'),
        t([0n, 'NOT'], new Not(new Val(0n)), new Val(BigInt('0x' + 'ff'.repeat(32))), '~0x0', 'not(0x0)'),
        t([1n, 'NOT'], new Not(new Val(1n)), new Val(BigInt('0x' + 'ff'.repeat(31) + 'fe')), '~0x1', 'not(0x1)'),
        t([2n, 3n, 'DIV', 'NOT'], new Not(new Div(new Val(3n), new Val(2n))), new Val(BigInt('0x' + 'ff'.repeat(31) + 'fe')), '~(0x3 / 0x2)', 'not(div(0x3, 0x2))'),
        t(['NUMBER', 'NOT'], new Not(Props['block.number']), id, '~block.number', 'not(number())'),
        t([1n, 1n, 'EQ'], new Val(1n), id, '0x1', '0x1'),
        t([1n, 2n, 'EQ'], new Val(0n), id, '0x0', '0x0'),
        t([1n, 'NUMBER', 'EQ'], new Eq(Props['block.number'], new Val(1n)), id, 'block.number == 0x1', 'eq(number(), 0x1)'),

        ...['06fdde03', '12345678', '00000001', '00000000'].map(selector =>
            [
                [2n ** 0xe0n, 0n, 'CALLDATALOAD', 'DIV', BigInt('0x' + selector), 'EQ'] satisfies StackStep[],
                [BigInt('0x' + selector), 2n ** 0xe0n, 0n, 'CALLDATALOAD', 'DIV', 'EQ'] satisfies StackStep[],
                [0n, 'CALLDATALOAD', 0xe0n, 'SHR', BigInt('0x' + selector), 'EQ'] satisfies StackStep[],
                [BigInt('0x' + selector), 0n, 'CALLDATALOAD', 0xe0n, 'SHR', 'EQ'] satisfies StackStep[],
            ].map(insts =>
                t(insts, new Sig(selector), id, `msg.sig == ${selector}`, `eq(msg.sig, ${selector})`)
            )
        ).flat(),

        t([2n, 3n, 'DIV', 1n, 'BYTE'], new Byte(new Val(1n), new Div(new Val(3n), new Val(2n))), new Val(0n), '(0x3 / 0x2 >> 0x1) & 1', 'byte(0x1, div(0x3, 0x2))'),
        t([2n, 3n, 'DIV', 2n, 'SHL'], new Shl(new Div(new Val(3n), new Val(2n)), new Val(2n)), new Val(4n), '0x3 / 0x2 << 0x2', 'shl(div(0x3, 0x2), 0x2)'),
    ],
    special: [
        t(['BASEFEE'], Props['block.basefee'], id, 'block.basefee', 'basefee()'),
        t(['CHAINID'], Props['block.chainid'], id, 'block.chainid', 'chainid()'),
        t(['COINBASE'], Props['block.coinbase'], id, 'block.coinbase', 'coinbase()'),
        t(['DIFFICULTY'], Props['block.difficulty'], id, 'block.difficulty', 'difficulty()'),
        t(['GASLIMIT'], Props['block.gaslimit'], id, 'block.gaslimit', 'gaslimit()'),
        t(['NUMBER'], Props['block.number'], id, 'block.number', 'number()'),
        t(['TIMESTAMP'], Props['block.timestamp'], id, 'block.timestamp', 'timestamp()'),
        t(['PREVRANDAO'], Props['block.prevrandao'], id, 'block.prevrandao', 'prevrandao()'),

        t(['CALLER'], Props['msg.sender'], id, 'msg.sender', 'caller()'),
        t(['CALLDATASIZE'], Props['msg.data.length'], id, 'msg.data.length', 'calldatasize()'),

        t(['ORIGIN'], Props['tx.origin'], id, 'tx.origin', 'origin()'),
        t(['GASPRICE'], Props['tx.gasprice'], id, 'tx.gasprice', 'gasprice()'),

        t(['CALLVALUE'], new CallValue(), id, 'msg.value', 'callvalue()'),

        t([0n, 'CALLDATALOAD'], new CallDataLoad(new Val(0n)), id, 'msg.data', 'calldataload(0x0)'),
        t([4n, 'CALLDATALOAD'], new CallDataLoad(new Val(4n)), id, '_arg0', 'calldataload(0x4)'),
        t([36n, 'CALLDATALOAD'], new CallDataLoad(new Val(36n)), id, '_arg1', 'calldataload(0x24)'),
        t([68n, 'CALLDATALOAD'], new CallDataLoad(new Val(68n)), id, '_arg2', 'calldataload(0x44)'),
        t([1n, 'CALLDATALOAD'], new CallDataLoad(new Val(1n)), id, 'msg.data[0x1]', 'calldataload(0x1)'),
        t([32n, 'CALLDATALOAD'], new CallDataLoad(new Val(32n)), id, 'msg.data[0x20]', 'calldataload(0x20)'),
        t([2n, 1n, 'ADD', 'CALLDATALOAD'], new CallDataLoad(new Add(new Val(1n), new Val(2n))), new CallDataLoad(new Val(3n)), 'msg.data[0x1 + 0x2]', 'calldataload(add(0x1, 0x2))'),
    ],
    memory: [
        t([8n, 4n, 'ADD', 'MLOAD'], new MLoad(new Add(new Val(4n), new Val(8n))), new MLoad(new Val(12n)), 'memory[0x4 + 0x8]', 'mload(add(0x4, 0x8))'),
        t(
            [8n, 4n, 'ADD', 'MLOAD'],
            new MLoad(new Add(new Val(4n), new Val(8n)), Props['block.chainid']),
            Props['block.chainid'],
            'memory[0x4 + 0x8]', 'mload(add(0x4, 0x8))',
            { 12: Props['block.chainid'] }
        ),
        t(['MSIZE'], new Prop('msize()', 'uint'), id, 'msize()', 'msize()'),
    ],
    system: [
        t([8n, 4n, 'SHA3'], new Sha3(new Val(4n), new Val(8n), [new MLoad(new Val(4n))]), id, 'keccak256(memory[0x4])', 'keccak256(0x4, 0x8 /*mload(0x4)*/)'),
        t([8n, 'MSIZE', 'SHA3'], new Sha3(new Prop('msize()', 'uint'), new Val(8n)), id, 'keccak256(memory[msize():(msize()+0x8)])', 'keccak256(msize(), 0x8 /*no args*/)'),
        t(
            [0x20n, 0x40n, 'SHA3'],
            new Sha3(new Val(0x40n), new Val(0x20n), [new CallValue()]),
            id,
            'keccak256(msg.value)',
            'keccak256(0x40, 0x20 /*callvalue()*/)',
            { 0x40: new CallValue() }
        ),
    ],
};

describe('::exprs', function () {
    Object.entries($exprs).forEach(([name, exprs]) => {
        describe(name, function () {
            exprs.forEach(({ insts, expr, val, solstr, yulstr, memory }) => {
                describe(title(expr), function () {
                    it(`should \`eval\` \`${solstr}\``, function () {
                        expect(expr.eval()).to.be.deep.equal(val);
                    });

                    it(`should \`STEP\` \`[${insts.map(i => trunc(i, 12)).join('|')}]\` into expr`, function () {
                        const step = new Shanghai();
                        const state = new State<never, Expr>();
                        Object.assign(state.memory, memory);

                        for (const inst of insts) {
                            if (typeof inst === 'bigint') {
                                state.stack.push(new Val(inst));
                            } else {
                                step[inst](state);
                            }
                        }

                        expect(state.halted).to.be.false;
                        expect(state.stack.values).to.be.deep.equal([expr]);
                    });

                    it(`should \`sol\` expr into \`${solstr}\``, function () {
                        expect(sol`${expr}`).to.be.equal(solstr);
                    });

                    it(`should \`yul\` expr into \`${yulstr}\``, function () {
                        expect(yul`${expr}`).to.be.equal(yulstr);
                    });
                });
            });
        });
    });
});
