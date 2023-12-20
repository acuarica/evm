import type { Ram, State } from './state';

import { MLoad, MStore } from './ast/memory';
import { type Expr, type Inst, Val, Locali, Local } from './ast';
import { Invalid } from './ast/system';
import { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './ast/logic';
import { Add, Div, Exp, Mod, Mul, Sub } from './ast/math';
import { CallDataLoad, CallValue, DataCopy, FNS, Fn, Info } from './ast/special';
import { Call, CallCode, Create, Create2, DelegateCall, Return, ReturnData, Revert, SelfDestruct, Sha3, StaticCall, Stop } from './ast/system';
import { type IEvents, Log } from './ast/log';
import { type IStore, MappingLoad, MappingStore, SLoad, SStore, Variable } from './ast';
import { Branch, Jump, Jumpi, SigCase } from './ast/flow';

/**
 * Store selectors starting point.
 */
export type ISelectorBranches = Map<string, { pc: number; state: State<Inst, Expr> }>;

// type ObjectToUnion<
//   T extends object,
//   U = { [K in keyof T]: { key: K; value: T[K] } }
// > = U[keyof U]

const mapValues = <K extends string, V, W>(o: { [k in K]: V }, fn: (v: V) => W) =>
    Object.fromEntries(Object.entries(o).map(([name, value]) => [name, fn(value)]));


/**
 * Represents an opcode found in the bytecode augmented with
 * offset and operand information as defined by the EVM.
 *
 * It can be either a unary opcode, _which does not take any operand data_,
 * or either a `PUSHn` mnemonic augmented with its `pushData`.
 * That is, all but `PUSHn` `n >= 1` opcodes are unary opcodes.
 *
 */
export class Opcode<M = unknown> {

    constructor(
        /**
         * This is the offset in the bytecode where this `Opcode` was found.
         * Both jump instructions, _i.e._, `JUMP` and `JUMPI`,
         * expects a stack operand referencing this `offset` in the bytecode.
         */

        /**
         * The Program Counter of this `Opcode`.
         * The index in the `Opcode[]` where this `Opcode` is inserted.
         */
        readonly pc: number,

        /**
         * Any byte number, _i.e._, between 0 and 255 representing the opcode byte.
         * The `opcode` may not be a valid opcode.
         */
        readonly opcode: number,

        /**
         * Represents a valid opcode.
         *
         * In https://www.evm.codes/ you can find an overview of each EVM opcode.
         *
         * If the `opcode` given is not a valid opcode,
         * you can provide `INVALID` as `mnemonic`.
         * 
         * A `PUSHn` opcode only permits a `PUSHn` opcode.
         */
        readonly mnemonic: M,

        /**
         * A `Unary` opcode does not include any `data`. For these opcodes `data` is `null`.
         * 
         * If this `Opcode` is a `PUSHn` instruction or contains any operand data,
         * then it contains the data attached to this instruction.
         */
        readonly data: null | Uint8Array
    ) { }

    /**
     * Returns the hexadecimal representation of `this` `data`.
     */
    hexData(): string {
        return this.data!.reduce((str, elem) => str + elem.toString(16).padStart(2, '0'), '');
    }

    /**
     * Returns a `string` representation of `this` `Opcode`.
     */
    format(): string {
        const pushData = this.data
            ? ` 0x${this.hexData()} (${parseInt(this.hexData(), 16)})`
            : '';

        return `@${this.pc}:${this.mnemonic}(0x${this.opcode.toString(16)})${pushData}`;
    }
}

type StepFn = (state: State<Inst, Expr>, opcode: Opcode) => void;

/**
 * This module is used to `decode` bytecode into `Opcode`.
 *
 * ### Example
 *
 * ```typescript
 * const { opcodes } = decode('0x6003600501');
 * ```
 *
 * @packageDocumentation
 */
/**
 * 
 * A map from numeric opcodes to string mnemonics.
 */
/**
 * Set of opcodes defined by the EVM.
 *
 * They are constructed from two kinds of opcodes.
 * `Unary` opcodes which takes no-arguments and,
 * `PUSHn` opcodes which takes an `n` byte argument from the bytecode.
 *
 * From these two different categories is easier to distinguish between the two.
 */
function Step<
    M extends Uppercase<string>,
    F extends StepFn
>(step: {
    readonly [m in M]: readonly [number | { opcode: number, size?: number, halts?: true }, F]
}): {
    readonly [m in M]: F;
} & {
    [o: number]: readonly [size: number, halts: boolean, M];
} {
    const ms = mapValues(step, ([, f]) => f);
    const os = Object.entries(step)
        .map(([m, [o,]]) => typeof o === 'number'
            ? [o, [0, false, m]] as const
            : [o.opcode, [o.size ?? 0, !!o.halts, m]] as const
        );
    return { ...ms, ...Object.fromEntries(os) };
}

export function STEP(
    events: IEvents = {},
    variables: IStore['variables'] = {},
    mappings: IStore['mappings'] = {},
    functionBranches: ISelectorBranches = new Map(),
) {
    return Object.assign(new Undef(),
        PUSHES(),
        STACK(),
        MATH(),
        SPECIAL(),
        MEMORY(),
        SYSTEM(),
        Step({
            PC: [0x58, ({ stack }, op) => stack.push(new Val(BigInt(op.pc)))],
            INVALID: [{ opcode: 0xfe, halts: true }, (state, op) => state.halt(new Invalid(op.opcode))],
        }),
        LOGS(events),
        STORAGE({ variables, mappings }),
        FLOW(functionBranches),
        PUSH0(),
    );
}

export interface Decoded<M> {

    /**
     * Represents the `Opcode`s found in `code`.
     */
    opcodes: Opcode<M>[];

    /**
     * Map between `JUMPDEST` instructions offset, _i.e._,
     * as they appear in the `code` buffer and its index in the `opcodes` array.
     *
     * It allows to quickly find the `JUMPDEST` instruction.
     */
    jumpdests: { [jd: number]: number };
}

/**
 * 
 */
type Mnemonic<T> = { [k in keyof T]: T[k] extends StepFn ? (k & string) : never }[keyof T];

class Undef {
    readonly [o: number]: readonly [size: number, halts: boolean, 'UNDEF'];

    constructor() {
        Object.assign(this,
            {
                UNDEF: (state: State<Inst, Expr>, op: Opcode): void => state.halt(new Invalid(op.opcode)),
            } as const,
            Object.fromEntries([...Array(256).keys()].map(k => [k, [0, true, 'UNDEF']] as const))
        );
    }

    hola = 'sddsdssdsddsdsds----';
    /**
     * Retrieves the `mnemonic` of the steps which `halts` the EVM `State`.
     */
    haltingSteps(): Mnemonic<this>[] {
        return [...Array(256).keys()]
            .map(o => (this as unknown as [unknown, boolean, never][])[o])
            .filter(([, halts, mnemonic]) => halts && mnemonic !== 'UNDEF')
            .map(([, , mnemonic]) => mnemonic);
    }

    /**
     * 
     */
    opcodes(): { readonly [m in Mnemonic<this>]: number } {
        return Object.fromEntries([...Array(256).keys()]
            .map(o => [this[o][2] as Mnemonic<this>, o] as const)
            .filter(([mnemonic,]) => mnemonic !== 'UNDEF')
        );
    }

    /**
     * Decodes the hexadecimal string `code` into `Opcode`s.
     * `code` may or may not begin with hex prefix `0x`.
     *
     * ### Example
     *
     * ```typescript
     * const { opcodes } = decode('0x6003600501');
     * ```
     *
     * @param code the hexadecimal string containing the bytecode to decode.
     * @returns
     */
    decode(code: string): Decoded<Mnemonic<this>> {
        if (code.length % 2 !== 0) {
            throw new Error('Unable to decode, input should have even length');
        }

        const start = code.slice(0, 2) === '0x' ? 2 : 0;
        const bytecode = fromHexString(code, start);

        const opcodes: Opcode<Mnemonic<this>>[] = [];
        const jumpdests: { [jd: number]: number } = {};

        for (let i = 0; i < bytecode.length; i++) {
            const opcode = bytecode[i];
            const [size, , mnemonic] = this[opcode];
            if (mnemonic as string === 'JUMPDEST') {
                jumpdests[i] = opcodes.length;
            }
            opcodes.push(new Opcode(
                i,
                opcode,
                mnemonic as Opcode<Mnemonic<this>>['mnemonic'],
                size === 0 ? null : (() => {
                    const data = bytecode.subarray(i + 1, i + size + 1);
                    i += size;
                    return data;
                })(),
            ));
        }

        return { opcodes: opcodes, jumpdests };
    }
}

/**
 * Represents an `Error` that occurs during decoding.
     position The position in the bytecode where the error occurred.
 * @param hexstr the hexadecimal string to convert to `Uint8Array`
 * @param start the index in `hexstr` where to start decoding.
 * @returns the `Uint8Array` representation of `hexstr`
 */
export function fromHexString(hexstr: string, start: number): Uint8Array {
    const buffer = new Uint8Array((hexstr.length - start) / 2);
    for (let i = start, j = 0; i < hexstr.length; i += 2, j++) {
        const value = parseInt(hexstr.slice(i, i + 2), 16);
        if (value >= 0) {
            buffer[j] = value;
        } else {
            throw new Error(`Unable to decode, invalid value found at ${i}`);
        }
    }
    return buffer;
}

function PUSHES() {
    return Step({
        PUSH1: push(1),
        PUSH2: push(2),
        PUSH3: push(3),
        PUSH4: push(4),
        PUSH5: push(5),
        PUSH6: push(6),
        PUSH7: push(7),
        PUSH8: push(8),
        PUSH9: push(9),
        PUSH10: push(10),
        PUSH11: push(11),
        PUSH12: push(12),
        PUSH13: push(13),
        PUSH14: push(14),
        PUSH15: push(15),
        PUSH16: push(16),
        PUSH17: push(17),
        PUSH18: push(18),
        PUSH19: push(19),
        PUSH20: push(20),
        PUSH21: push(21),
        PUSH22: push(22),
        PUSH23: push(23),
        PUSH24: push(24),
        PUSH25: push(25),
        PUSH26: push(26),
        PUSH27: push(27),
        PUSH28: push(28),
        PUSH29: push(29),
        PUSH30: push(30),
        PUSH31: push(31),
        PUSH32: push(32),
    });

    function push(size: number) {
        return [
            { opcode: 0x60 - 1 + size, size },
            ({ stack }: State<Inst, Expr>, opcode: Opcode) => stack.push(new Val(BigInt('0x' + opcode.hexData()), true))
        ] as const;
    }
}

/**
 * Set of stack related steps, `PUSHn`, `DUPn` and `SWAPn` opcodes.
 */
function STACK() {
    return Step({
        POP: [0x50, ({ stack }) => {
            const expr = stack.pop();
            if (expr.tag === 'Local') {
                // expr.nrefs--;
                // console.log('POP: Local', expr);
                // throw new Error('POP: Local');
            }
        }],

        DUP1: dup(0),
        DUP2: dup(1),
        DUP3: dup(2),
        DUP4: dup(3),
        DUP5: dup(4),
        DUP6: dup(5),
        DUP7: dup(6),
        DUP8: dup(7),
        DUP9: dup(8),
        DUP10: dup(9),
        DUP11: dup(10),
        DUP12: dup(11),
        DUP13: dup(12),
        DUP14: dup(13),
        DUP15: dup(14),
        DUP16: dup(15),

        SWAP1: swap(1),
        SWAP2: swap(2),
        SWAP3: swap(3),
        SWAP4: swap(4),
        SWAP5: swap(5),
        SWAP6: swap(6),
        SWAP7: swap(7),
        SWAP8: swap(8),
        SWAP9: swap(9),
        SWAP10: swap(10),
        SWAP11: swap(11),
        SWAP12: swap(12),
        SWAP13: swap(13),
        SWAP14: swap(14),
        SWAP15: swap(15),
        SWAP16: swap(16),
    });

    function dup(position: number) {
        return [0x80 + position, function (state: State<Inst, Expr>) {
            if (position >= state.stack.values.length) {
                throw new Error('Invalid duplication operation, position was not found');
                // state.stack.values[position] = Block.coinbase;
            }

            const expr = state.stack.values[position];
            if (expr.tag !== 'Local') {
                const local = new Local(state.nlocals++, expr);
                state.stack.values[position] = local;
                state.stmts.push(new Locali(local));
            } else {
                expr.nrefs++;
            }
            state.stack.push(state.stack.values[position]);
        }] as const;
    }

    function swap(position: number) {
        return [0x90 - 1 + position, ({ stack }: State<Inst, Expr>) => stack.swap(position)] as const;
    }
}

function MATH() {
    return Step({
        ADD: [0x01, bin(Add)],
        MUL: [0x02, bin(Mul)],
        SUB: [0x03, bin(Sub)],
        DIV: [0x04, bin(Div)],
        SDIV: [0x05, bin(Div)],
        MOD: [0x06, bin(Mod)],
        SMOD: [0x07, bin(Mod)],
        ADDMOD: [0x08, ({ stack }) => {
            const left = stack.pop();
            const right = stack.pop();
            const mod = stack.pop();
            stack.push(
                left.isVal() && right.isVal() && mod.isVal()
                    ? new Val((left.val + right.val) % mod.val)
                    : left.isVal() && right.isVal()
                        ? new Mod(new Val(left.val + right.val), mod)
                        : new Mod(new Add(left, right), mod)
            );
        }],
        MULMOD: [0x09, ({ stack }) => {
            const left = stack.pop();
            const right = stack.pop();
            const mod = stack.pop();
            stack.push(
                left.isVal() && right.isVal() && mod.isVal()
                    ? new Val((left.val * right.val) % mod.val)
                    : left.isVal() && right.isVal()
                        ? new Mod(new Val(left.val * right.val), mod)
                        : new Mod(new Mul(left, right), mod)
            );
        }],
        EXP: [0x0a, bin(Exp)],
        SIGNEXTEND: [0x0b, ({ stack }) => {
            const left = stack.pop();
            const right = stack.pop();
            stack.push(
                left.isVal() && right.isVal()
                    ? new Val((right.val << (32n - left.val)) >> (32n - left.val))
                    : left.isVal()
                        ? new Sar(new Shl(right, new Val(32n - left.val)), new Val(32n - left.val))
                        : new Sar(new Shl(right, new Sub(new Val(32n), left)), new Sub(new Val(32n), left))
            );
        }],

        LT: [0x10, bin(Lt)],
        GT: [0x11, bin(Gt)],
        SLT: [0x12, bin(Lt)],
        SGT: [0x13, bin(Gt)],
        EQ: [0x14, ({ stack }: Ram<Expr>): void => {
            const DIVEXPsig = (left: Expr, right: Expr): Sig | undefined => {
                left = left.eval();
                right = right.eval();

                if (left.isVal() && right.tag === 'Div' && right.right.isVal()) {
                    const selector = left.val * right.right.val;
                    right = right.left;

                    if (selector % (1n << 0xe0n) === 0n &&
                        right.tag === 'CallDataLoad' &&
                        right.location.isZero()) {
                        return new Sig(
                            selector
                                .toString(16)
                                .substring(0, 8 - (64 - selector.toString(16).length))
                                .padStart(8, '0')
                        );
                    }
                }

                return undefined;
            };

            const SHRsig = (left: Expr, right: Expr): Sig | undefined => {
                left = left.eval();
                right = right.eval();
                return left.isVal() &&
                    right.tag === 'Shr' &&
                    right.shift.isVal() &&
                    right.shift.val === 0xe0n &&
                    right.value.tag === 'CallDataLoad' &&
                    right.value.location.isZero()
                    ? new Sig(left.val.toString(16).padStart(8, '0'))
                    : undefined;
            };

            const left = stack.pop();
            const right = stack.pop();

            stack.push(
                left.isVal() && right.isVal()
                    ? left.val === right.val
                        ? new Val(1n)
                        : new Val(0n)
                    : DIVEXPsig(left, right) ??
                    DIVEXPsig(right, left) ??
                    SHRsig(left, right) ??
                    SHRsig(right, left) ??
                    new Eq(left, right)
            );
        }],
        ISZERO: [0x15, ({ stack }: Ram<Expr>): void => {
            const value = stack.pop();
            stack.push(new IsZero(value));
        }],
        AND: [0x16, bin(And)],
        OR: [0x17, bin(Or)],
        XOR: [0x18, bin(Xor)],
        NOT: [0x19, ({ stack }) => {
            const value = stack.pop();
            stack.push(new Not(value));
        }],
        BYTE: [0x1a, ({ stack }) => {
            const position = stack.pop();
            const data = stack.pop();
            stack.push(new Byte(position, data));
        }],
        SHL: [0x1b, shift(Shl)],
        SHR: [0x1c, shift(Shr)],
        SAR: [0x1d, shift(Sar)],
    });

    function bin(Cons: new (lhs: Expr, rhs: Expr) => Expr): ({ stack }: Ram<Expr>) => void {
        return function ({ stack }: Ram<Expr>) {
            const lhs = stack.pop();
            const rhs = stack.pop();
            stack.push(new Cons(lhs, rhs));
        };
    }

    function shift(Cons: new (value: Expr, shift: Expr) => Expr): ({ stack }: Ram<Expr>) => void {
        return function ({ stack }: Ram<Expr>) {
            const shift = stack.pop();
            const value = stack.pop();
            stack.push(new Cons(value, shift));
        };
    }
}

/**
 * https://eips.ethereum.org/EIPS/eip-3198
 */
function SPECIAL() {
    const mapKeys = <K extends string, U>(o: { [k in K]: unknown }, fn: (k: K) => U) =>
        Object.fromEntries(Object.keys(o).map(k => [k, fn(k)]));

    return Step({
        ...mapValues(Info, sym => [sym.opcode, state => state.stack.push(sym)]),
        ...mapKeys(FNS, n => [FNS[n][2], state => state.stack.push(new Fn(n, state.stack.pop()))]),
        CALLVALUE: [0x34, ({ stack }) => stack.push(new CallValue())],
        CALLDATALOAD: [0x35, ({ stack }) => stack.push(new CallDataLoad(stack.pop()))],
        CALLDATACOPY: [0x37, state => datacopy('calldatacopy')(state)],
        CODECOPY: [0x39, state => datacopy('codecopy')(state)],
        EXTCODECOPY: [0x3c, state => {
            const address = state.stack.pop();
            datacopy('extcodecopy')(state, address);
        }],
        RETURNDATACOPY: [0x3e, state => datacopy('returndatacopy')(state)],
    } as const satisfies { [m: string]: readonly [opcode: number, (state: Ram<Expr>) => void]; });

    function datacopy(kind: DataCopy['kind']) {
        return ({ stack, memory }: Ram<Expr>, address?: Expr): void => {
            const dest = stack.pop();
            const offset = stack.pop();
            const size = stack.pop();
            if (!dest.isVal()) {
                // throw new Error('expected number in returndatacopy');
            } else {
                memory[Number(dest.val)] = new DataCopy(kind, offset, size, address);
            }
            // stmts.push(new MStore(location, data));
        };
    }
}

function MEMORY() {
    return Step({
        MLOAD: [0x51, ({ stack, memory }) => {
            let loc = stack.pop();
            loc = loc.eval();
            stack.push(
                loc.isVal() && Number(loc.val) in memory ? memory[Number(loc.val)] : new MLoad(loc)
            );
            // stmts.push(new Locali(new Local(-1, new MLoad(loc))));
        }],
        MSTORE: [0x52, mstore],
        MSTORE8: [0x53, mstore],
    });

    function mstore({ stack, memory, stmts }: State<Inst, Expr>): void {
        let location = stack.pop();
        const data = stack.pop();

        if (location.tag === 'Local') location.nrefs--;
        if (data.tag === 'Local') data.nrefs--;

        stmts.push(new MStore(location, data));

        location = location.eval();
        if (location.isVal()) {
            memory[Number(location.val)] = data;
        }
    }
}

/**
 * Keep track of https://eips.ethereum.org/EIPS/eip-6780
 */
function SYSTEM() {
    return Step({
        SHA3: [0x20, state => state.stack.push(memArgs(state, Sha3))],
        STOP: [{ opcode: 0x00, halts: true }, state => state.halt(new Stop())],
        CREATE: [0xf0, ({ stack }) => {
            const value = stack.pop();
            const offset = stack.pop();
            const size = stack.pop();
            stack.push(new Create(value, offset, size));
        }],
        CALL: [0xf1, ({ stack, memory }) => {
            const gas = stack.pop();
            const address = stack.pop();
            const value = stack.pop();
            const argsStart = stack.pop();
            const argsLen = stack.pop();
            const retStart = stack.pop();
            const retLen = stack.pop();
            stack.push(new Call(gas, address, value, argsStart, argsLen, retStart, retLen));
            if (retStart.isVal()) {
                memory[Number(retStart.val)] = new ReturnData(retStart, retLen);
            }
        }],
        CALLCODE: [0xf2, ({ stack }) => {
            const gas = stack.pop();
            const address = stack.pop();
            const value = stack.pop();
            const argsStart = stack.pop();
            const argsLen = stack.pop();
            const retStart = stack.pop();
            const retLen = stack.pop();
            stack.push(new CallCode(gas, address, value, argsStart, argsLen, retStart, retLen));
        }],
        RETURN: [{ opcode: 0xf3, halts: true }, state => state.halt(memArgs(state, Return))],
        DELEGATECALL: [0xf4, ({ stack }) => {
            const gas = stack.pop();
            const address = stack.pop();
            const argsStart = stack.pop();
            const argsLen = stack.pop();
            const retStart = stack.pop();
            const retLen = stack.pop();
            stack.push(new DelegateCall(gas, address, argsStart, argsLen, retStart, retLen));
        }],
        CREATE2: [0xf5, ({ stack }) => {
            const value = stack.pop();
            const memoryStart = stack.pop();
            const memoryLength = stack.pop();
            stack.push(new Create2(memoryStart, memoryLength, value));
        }],
        STATICCALL: [0xfa, ({ stack }) => {
            const gas = stack.pop();
            const address = stack.pop();
            const argsStart = stack.pop();
            const argsLen = stack.pop();
            const retStart = stack.pop();
            const retLen = stack.pop();
            stack.push(new StaticCall(gas, address, argsStart, argsLen, retStart, retLen));
        }],
        REVERT: [{ opcode: 0xfd, halts: true }, state => state.halt(memArgs(state, Revert))],
        SELFDESTRUCT: [{ opcode: 0xff, halts: true }, state => {
            const address = state.stack.pop();
            state.halt(new SelfDestruct(address));
        }],
    });

    function memArgs<T>(
        { stack, memory }: State<Inst, Expr>,
        Klass: new (offset: Expr, size: Expr, args?: Expr[]) => T
    ): T {
        const MAXSIZE = 1024;

        const offset = stack.pop();
        const size = stack.pop();

        return new Klass(offset, size, (function (offset, size) {
            if (offset.isVal() && size.isVal() && size.val <= MAXSIZE * 32) {
                const args = [];
                for (let i = Number(offset.val); i < Number(offset.val + size.val); i += 32) {
                    args.push(i in memory ? memory[i].eval() : new MLoad(new Val(BigInt(i))));
                }
                return args;
            } else {
                if (size.isVal() && size.val > MAXSIZE * 32) {
                    throw new Error(`memargs size ${Klass.name} ${size.val}`);
                }

                return undefined;
            }
        })(offset.eval(), size.eval()));
    }
}

function LOGS(events: IEvents) {
    return Object.assign({ events }, Step({
        LOG0: log(0, events),
        LOG1: log(1, events),
        LOG2: log(2, events),
        LOG3: log(3, events),
        LOG4: log(4, events),
    }));

    function log(topicsCount: number, events: IEvents) {
        return [0xa0 + topicsCount, ({ stack, memory, stmts }: State<Inst, Expr>): void => {
            const offset = stack.pop();
            const size = stack.pop();

            const topics = [];
            for (let i = 0; i < topicsCount; i++) {
                topics.push(stack.pop());
            }

            let event: IEvents[string] | undefined = undefined;
            if (topics.length > 0 && topics[0].isVal()) {
                const eventTopic = topics[0].val.toString(16).padStart(64, '0');
                event = events[eventTopic];
                if (event === undefined) {
                    event = { indexedCount: topics.length - 1 };
                    events[eventTopic] = event;
                }
            }

            stmts.push(new Log(event, offset, size, topics, (function (offset, size) {
                if (offset.isVal() && size.isVal()) {
                    const args = [];
                    for (let i = Number(offset.val); i < Number(offset.val + size.val); i += 32) {
                        args.push(i in memory ? memory[i] : new MLoad(new Val(BigInt(i))));
                    }
                    return args;
                } else {
                    return undefined;
                }
            })(offset.eval(), size.eval())));
        }] as const;
    }
}

function STORAGE({ variables, mappings }: IStore) {
    return {
        variables,
        mappings,
        ...Step({
            SLOAD: [0x54, ({ stack }) => {
                const loc = stack.pop();

                if (loc.tag === 'Sha3') {
                    const [base, parts] = parseSha3(loc);
                    if (base !== undefined && parts.length > 0) {
                        stack.push(new MappingLoad(loc, mappings, base, parts));
                    } else {
                        stack.push(new SLoad(loc, variables));
                    }
                } else if (loc.tag === 'Add' && loc.left.tag === 'Sha3' && loc.right.isVal()) {
                    const [base, parts] = parseSha3(loc.left);
                    if (base !== undefined && parts.length > 0) {
                        stack.push(new MappingLoad(loc, mappings, base, parts, loc.right.val));
                    } else {
                        stack.push(new SLoad(loc, variables));
                    }
                } else if (loc.tag === 'Add' && loc.left.isVal() && loc.right.tag === 'Sha3') {
                    const [base, parts] = parseSha3(loc.right);
                    if (base !== undefined && parts.length > 0) {
                        stack.push(new MappingLoad(loc, mappings, base, parts, loc.left.val));
                    } else {
                        stack.push(new SLoad(loc, variables));
                    }
                } else {
                    stack.push(new SLoad(loc, variables));
                }
            }],

            SSTORE: [0x55, ({ stack, stmts }) => {
                const slot = stack.pop();
                const value = stack.pop();

                if (slot.isVal()) {
                    sstoreVariable();
                } else if (slot.tag === 'Sha3') {
                    const [base, parts] = parseSha3(slot);
                    if (base !== undefined && parts.length > 0) {
                        stmts.push(new MappingStore(slot, mappings, base, parts, value));
                    } else {
                        sstoreVariable();
                    }
                } else if (slot.tag === 'Add' && slot.left.tag === 'Sha3' && slot.right.isVal()) {
                    const [base, parts] = parseSha3(slot.left);
                    if (base !== undefined && parts.length > 0) {
                        stmts.push(
                            new MappingStore(slot, mappings, base, parts, value, slot.right.val)
                        );
                    } else {
                        sstoreVariable();
                    }
                } else if (slot.tag === 'Add' && slot.left.isVal() && slot.right.tag === 'Sha3') {
                    const [base, parts] = parseSha3(slot.right);
                    if (base !== undefined && parts.length > 0) {
                        stmts.push(new MappingStore(slot, mappings, base, parts, value, slot.left.val));
                    } else {
                        sstoreVariable();
                    }
                } else {
                    sstoreVariable();
                }

                function sstoreVariable() {
                    if (slot.isVal()) {
                        const key = slot.val.toString();
                        if (key in variables) {
                            variables[key].types.push(value);
                        } else {
                            variables[key] = new Variable(undefined, [value]);
                        }
                    }
                    stmts.push(new SStore(slot, value, variables));
                }
            }],
        })
    } as const;

    function parseSha3(sha: Sha3): [number | undefined, Expr[]] {
        const shas = [sha];
        const mappings = [];
        let base = undefined;
        while (shas.length > 0) {
            const sha = shas.shift()!;
            for (const arg of sha.args ?? []) {
                if (arg.tag === 'Sha3' && arg.args) {
                    shas.unshift(arg);
                } else if (base === undefined && arg.tag === 'Val') {
                    base = Number(arg.val);
                } else {
                    mappings.unshift(arg);
                }
            }
        }
        return [base, mappings];
    }
}

/**
 * Keep track of https://eips.ethereum.org/EIPS/eip-4200
 */
function FLOW(functionBranches: ISelectorBranches) {
    return {
        functionBranches,
        ...Step({
            JUMPDEST: [0x5b, _state => { }],
            JUMP: [0x56, function JUMP(this: Undef, state, opcode) {
                // console.log(this.hola, 'JUMP');

                const offset = state.stack.pop();
                const destpc = getDest(offset, opcode);
                const destBranch = Branch.make(destpc, state);
                state.halt(new Jump(offset, destBranch));
            }],
            JUMPI: [0x57, function JUMPI(this: Undef, state, opcode) {
                // console.log(this.hola, 'JUMPI');

                const offset = state.stack.pop();
                const cond = state.stack.pop();
                const destpc = getDest(offset, opcode);

                const fallBranch = Branch.make(opcode.pc + 1, state);

                let last: SigCase | Jumpi;
                if (cond.tag === 'Sig') {
                    functionBranches.set(cond.selector, {
                        pc: destpc,
                        state: state.clone(),
                    });
                    last = new SigCase(cond, offset, fallBranch);
                } else {
                    last = new Jumpi(cond, offset, fallBranch, Branch.make(destpc, state));
                }
                state.halt(last);
            }],
        })
    } as const;

    /**
     * @param offset
     * @param opcode Only used for error reporting.
     */
    function getDest(offset: Expr, opcode: Opcode): number {
        const offset2 = offset.eval();
        if (!offset2.isVal()) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-imports
            throw new Error(`Numeric offset not found on stack @${opcode.format()}`);
        }
        return Number(offset2.val);
        // const destpc = opcode.jumpdests![Number(offset2.val)];
        // if (destpc !== undefined) {
        // (offset as Val).jumpDest = destpc;
        // return destpc;
        // } else {
        // const dest = opcodes.find(o => o.offset === Number(offset2.val));
        // if (!dest) {
        //     throw new Error(`Expected JUMPDEST, but found ${formatOpcode(opcode)}`);
        // }
        // throw new Error(`JUMP destination should be JUMPDEST but found @${formatOpcode(dest)}`);
        // throw new Error(`JUMP destination should be JUMPDEST but found @?`);
        // }
    }
}

/**
 * https://eips.ethereum.org/EIPS/eip-3855
 */
function PUSH0() {
    return Step({
        PUSH0: [0x5f, ({ stack }) => stack.push(new Val(0n))],
    });
}

// Block.qw = new Prop(['asdf', 'uint']);
// const STEP = {
//     PREVRANDAO: [0x44, ({ stack }: { stack: Stack<Expr> }) => {
//         stack.push(Block.basefee);
//     }],

// };
