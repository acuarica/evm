import { ExecError, type Operand, type Ram, type State } from './state';

import { MLoad, MStore } from './ast/memory';
import { type Expr, type Inst, Val, Locali, Local } from './ast';
import { Invalid } from './ast/system';
import { Add, Div, Exp, Mod, Mul, Sub } from './ast/alu';
import { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './ast/alu';
import { CallDataLoad, CallValue, DataCopy, FNS, Fn, Prop, Props } from './ast/special';
import { Call, CallCode, Create, Create2, DelegateCall, Return, ReturnData, Revert, SelfDestruct, Sha3, StaticCall, Stop } from './ast/system';
import { type IEvents, Log } from './ast/log';
import { type IStore, MappingLoad, MappingStore, SLoad, SStore, Variable } from './ast';
import { Branch, Jump, Jumpi, SigCase } from './ast/flow';

/**
 * Represents an opcode found in the bytecode augmented with
 * offset and operand information as defined by the EVM.
 *
 * It can be either a unary opcode, _which does not take any operand data_,
 * or either a `PUSHn` mnemonic augmented with its push `data`.
 * That is, all but `PUSHn` `n >= 1` opcodes are unary opcodes.
 *
 * `PUSHn` `n >= 1` opcodes takes an `n`-byte argument from the bytecode.
 * Note that `PUSH0`[^1] does not take any data argument from the bytecode (just pushes `0` onto the `Stack`).
 * Thus it can be considered as an unary opcode.
 * 
 * [^1]: https://eips.ethereum.org/EIPS/eip-3855
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
    hexData(): string | undefined {
        return this.data?.reduce((str, elem) => str + elem.toString(16).padStart(2, '0'), '');
    }

    /**
     * Returns a `string` representation of `this` `Opcode`.
     */
    format(): string {
        const pushData = this.data
            ? ` 0x${this.hexData()} (${parseInt(this.hexData()!, 16)})`
            : '';

        return `${this.mnemonic}(0x${this.opcode.toString(16)})@${this.pc}${pushData}`;
    }
}

/**
 * 
 */
export class Members {

    readonly events: IEvents = {};

    readonly variables: IStore['variables'] = {};

    readonly mappings: IStore['mappings'] = {};

    /**
     * Store selectors', _i.e._, public and external `function`s program counter entry.
     */
    readonly functionBranches: Map<string, { pc: number, state: State<Inst, Expr> }> = new Map();

}

/**
 * This module is used to `decode` bytecode into `Opcode`.
 * 
 * Maps numeric opcodes (byte between `0` and `255`) to decode configuration and string mnemonic.
 * That is, for the given `opcode`, 
 * `size` indicates the size of the `opcode`'s operand to consume from bytecode in bytes.
 * `halts` indicates where the step associated with this `opcode` should `halt` the EVM `State`.
 * `mnemonic` indicates the step the `EVM` should execute.
 */
export class Undef<M extends string> extends Members {

    [opcode: number]: [size: number, halts: boolean, mnemonic: M];

    constructor() {
        super();
        Object.assign(this,
            Object.fromEntries([...Array(256).keys()].map(k => [k, [0, true, 'UNDEF']]))
        );
    }

    UNDEF = (state: State<Inst, Expr>, op: Opcode): void => state.halt(new Invalid(op.opcode));

    /**
     * Retrieves the `mnemonic` of the steps which `halts` the EVM `State`.
     */
    haltingSteps(): M[] {
        return [...Array(256).keys()]
            .map(o => (this as unknown as [unknown, boolean, never][])[o])
            .filter(([, halts, mnemonic]) => halts && mnemonic !== 'UNDEF')
            .map(([, , mnemonic]) => mnemonic);
    }

    /**
     * Retrieves the opcodes by mnemonic.
     */
    opcodes(): { readonly [m in M]: number } {
        return Object.fromEntries([...Array(256).keys()]
            .map(o => [this[o][2], o] as const)
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
     * const opcodes = this.decode('0x6003600501');
     * ```
     *
     * @param code the hexadecimal string containing the bytecode to decode.
     * @returns the decoded `Opcode`s found in `code`.
     */
    decode(code: string): Opcode<M>[] {
        const bytecode = fromHexString(code);
        const opcodes: Opcode<M>[] = [];

        for (let pc = 0; pc < bytecode.length; pc++) {
            const opcode = bytecode[pc];
            const [size, , mnemonic] = this[opcode];
            opcodes.push(new Opcode(
                pc,
                opcode,
                mnemonic,
                size === 0 ? null : (() => {
                    const data = bytecode.subarray(pc + 1, pc + size + 1);
                    pc += size;
                    return data;
                })(),
            ));
        }

        return opcodes;
    }

    *decode2(code: string) {
        const bytecode = fromHexString(code);

        for (let pc = 0; pc < bytecode.length; pc++) {
            const opcode = bytecode[pc];
            const [size, , mnemonic] = this[opcode];
            yield new Opcode(
                pc,
                opcode,
                mnemonic,
                size === 0 ? null : function () {
                    const data = bytecode.subarray(pc + 1, pc + size + 1);
                    if (data.length !== size) throw new Error('asdfsadfdffd');
                    pc += size;
                    return data;
                }(),
            );
        }

        throw new Error('sdsdsdsdsd');
    }
}

/**
 * Represents an `Error` that occurs during decoding.
 * position The position in the bytecode where the error occurred.
 * @param hexstr the hexadecimal string to convert to `Uint8Array`
 * @returns the `Uint8Array` representation of `hexstr`
 */
export function fromHexString(hexstr: string): Uint8Array {
    if (hexstr.length % 2 !== 0) {
        throw new Error(`Unable to decode, input should have even length, but got length '${hexstr.length}'`);
    }

    const start = hexstr.slice(0, 2).toLowerCase() === '0x' ? 2 : 0;
    const buffer = new Uint8Array((hexstr.length - start) / 2);
    for (let i = start, j = 0; i < hexstr.length; i += 2, j++) {
        const byte = hexstr.slice(i, i + 2);
        const value = parseInt(byte, 16);
        if (value >= 0) {
            buffer[j] = value;
        } else {
            throw new Error(`Unable to decode, invalid hex byte '${byte}' found at position '${i + 1}'`);
        }
    }
    return buffer;
}

/**
 * 
 */
export type StepFn = (state: State<Inst, Expr>, opcode: Opcode, bytecode: Uint8Array) => void;

/**
 * 
 */
type Step = { readonly [m in string]: readonly [
    number | { opcode: number, size?: number, halts?: true },
    step: StepFn,
] };

const ALU = {
    ADDMOD: [0x08, ({ stack }) => {
        const left = stack.pop();
        const right = stack.pop();
        const mod = stack.pop();
        stack.push(left.isVal() && right.isVal() && mod.isVal()
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
        stack.push(left.isVal() && right.isVal() && mod.isVal()
            ? new Val((left.val * right.val) % mod.val)
            : left.isVal() && right.isVal()
                ? new Mod(new Val(left.val * right.val), mod)
                : new Mod(new Mul(left, right), mod)
        );
    }],
    SIGNEXTEND: [0x0b, ({ stack }) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(left.isVal() && right.isVal()
            ? new Val((right.val << (32n - left.val)) >> (32n - left.val))
            : left.isVal()
                ? new Sar(new Shl(right, new Val(32n - left.val)), new Val(32n - left.val))
                : new Sar(new Shl(right, new Sub(new Val(32n), left)), new Sub(new Val(32n), left))
        );
    }],

    EQ: [0x14, ({ stack }) => {
        const DIVEXPsig = (left: Expr, right: Expr): Sig | undefined => {
            left = left.eval();
            right = right.eval();

            if (left.isVal() && right.tag === 'Div' && right.right.isVal()) {
                const selector = left.val * right.right.val;
                right = right.left;

                if (selector % (1n << 0xe0n) === 0n &&
                    right.tag === 'CallDataLoad' &&
                    right.location.isZero()) {
                    return new Sig(selector
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

        stack.push(left.isVal() && right.isVal()
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
    ISZERO: [0x15, ({ stack }) => {
        const value = stack.pop();
        stack.push(new IsZero(value));
    }],
    NOT: [0x19, ({ stack }) => {
        const value = stack.pop();
        stack.push(new Not(value));
    }],
    BYTE: [0x1a, ({ stack }) => {
        const position = stack.pop();
        const data = stack.pop();
        stack.push(new Byte(position, data));
    }],
} satisfies { [m: string]: [opcode: number, (state: Operand<Expr>) => void] };

const prop = (symbol: keyof typeof Props) => ({ stack }: Operand<Expr>) => stack.push(Props[symbol]);

const SPECIAL = {
    COINBASE: [0x41, prop('block.coinbase')],
    TIMESTAMP: [0x42, prop('block.timestamp')],
    NUMBER: [0x43, prop('block.number')],
    DIFFICULTY: [0x44, prop('block.difficulty')],
    GASLIMIT: [0x45, prop('block.gaslimit')],
    CALLER: [0x33, prop('msg.sender')],
    CALLDATASIZE: [0x36, prop('msg.data.length')],
    ORIGIN: [0x32, prop('tx.origin')],
    GASPRICE: [0x3a, prop('tx.gasprice')],
    ADDRESS: [0x30, prop('address(this)')],
    CODESIZE: [0x38, prop('codesize()')],
    RETURNDATASIZE: [0x3d, prop('returndatasize()')],
    GAS: [0x5a, prop('gasleft()')],

    CALLVALUE: [0x34, ({ stack }) => stack.push(new CallValue())],
    CALLDATALOAD: [0x35, ({ stack }) => stack.push(new CallDataLoad(stack.pop()))],
} satisfies { [m: string]: readonly [opcode: number, (state: Operand<Expr>) => void] };

const datacopy = (kind: DataCopy['kind']) => function datacopy({ stack, memory }: Ram<Expr>, address?: Expr) {
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

const DATACOPY = {
    CALLDATACOPY: [0x37, state => datacopy('calldatacopy')(state)],
    CODECOPY: [0x39, function codecopy({ stack, memory }, _opcode, bytecode) {
        const dest = stack.pop().eval();
        const offset = stack.pop();
        const size = stack.pop();
        if (!dest.isVal()) {
            throw new Error('expected number in codecopy');
        } else {
            memory[Number(dest.val)] = new DataCopy('codecopy', offset, size, undefined,
                ((offset, size) => {
                    if (offset.isVal() && size.isVal()) {
                        return bytecode.subarray(Number(offset.val), Number(offset.val + size.val));
                    }
                    return undefined;
                })(offset.eval(), size.eval())
            );
        }
    }],
    EXTCODECOPY: [0x3c, state => {
        const address = state.stack.pop();
        datacopy('extcodecopy')(state, address);
    }],
    RETURNDATACOPY: [0x3e, state => datacopy('returndatacopy')(state)],
} satisfies { [m: string]: readonly [opcode: number, (state: Ram<Expr>, _opcode: unknown, bytecode: Uint8Array) => void] };

const mstore = ({ stack, memory, stmts }: State<Inst, Expr>) => {
    let location = stack.pop();
    const data = stack.pop();

    if (location.tag === 'Local') location.nrefs--;
    if (data.tag === 'Local') data.nrefs--;

    stmts.push(new MStore(location, data));

    location = location.eval();
    if (location.isVal()) {
        memory[Number(location.val)] = data;
    }
};

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

function log(ntopics: number) {
    return [0xa0 + ntopics, function (this: Members, { stack, memory, stmts }: State<Inst, Expr>) {
        const offset = stack.pop();
        const size = stack.pop();

        const topics = [];
        for (let i = 0; i < ntopics; i++) {
            topics.push(stack.pop());
        }

        let event: IEvents[string] | undefined = undefined;
        if (topics.length > 0 && topics[0].isVal()) {
            const eventTopic = topics[0].val.toString(16).padStart(64, '0');
            event = this.events[eventTopic];
            if (event === undefined) {
                event = { indexedCount: topics.length - 1 };
                this.events[eventTopic] = event;
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

const STORAGE = {
    SLOAD: [0x54, function sload(this: IStore, { stack }) {
        const loc = stack.pop();

        if (loc.tag === 'Sha3') {
            const [base, parts] = parseSha3(loc);
            if (base !== undefined && parts.length > 0) {
                stack.push(new MappingLoad(loc, this.mappings, base, parts));
            } else {
                stack.push(new SLoad(loc, this.variables));
            }
        } else if (loc.tag === 'Add' && loc.left.tag === 'Sha3' && loc.right.isVal()) {
            const [base, parts] = parseSha3(loc.left);
            if (base !== undefined && parts.length > 0) {
                stack.push(new MappingLoad(loc, this.mappings, base, parts, loc.right.val));
            } else {
                stack.push(new SLoad(loc, this.variables));
            }
        } else if (loc.tag === 'Add' && loc.left.isVal() && loc.right.tag === 'Sha3') {
            const [base, parts] = parseSha3(loc.right);
            if (base !== undefined && parts.length > 0) {
                stack.push(new MappingLoad(loc, this.mappings, base, parts, loc.left.val));
            } else {
                stack.push(new SLoad(loc, this.variables));
            }
        } else {
            stack.push(new SLoad(loc, this.variables));
        }
    }],

    SSTORE: [0x55, function sstore(this: IStore, { stack, stmts }) {
        const sstoreVariable = () => {
            if (slot.isVal()) {
                const key = slot.val.toString();
                if (key in this.variables) {
                    this.variables[key].types.push(value);
                } else {
                    this.variables[key] = new Variable(undefined, [value]);
                }
            }
            stmts.push(new SStore(slot, value, this.variables));
        };

        const slot = stack.pop();
        const value = stack.pop();

        if (slot.isVal()) {
            sstoreVariable();
        } else if (slot.tag === 'Sha3') {
            const [base, parts] = parseSha3(slot);
            if (base !== undefined && parts.length > 0) {
                stmts.push(new MappingStore(slot, this.mappings, base, parts, value));
            } else {
                sstoreVariable();
            }
        } else if (slot.tag === 'Add' && slot.left.tag === 'Sha3' && slot.right.isVal()) {
            const [base, parts] = parseSha3(slot.left);
            if (base !== undefined && parts.length > 0) {
                stmts.push(
                    new MappingStore(slot, this.mappings, base, parts, value, slot.right.val)
                );
            } else {
                sstoreVariable();
            }
        } else if (slot.tag === 'Add' && slot.left.isVal() && slot.right.tag === 'Sha3') {
            const [base, parts] = parseSha3(slot.right);
            if (base !== undefined && parts.length > 0) {
                stmts.push(new MappingStore(slot, this.mappings, base, parts, value, slot.left.val));
            } else {
                sstoreVariable();
            }
        } else {
            sstoreVariable();
        }
    }],
} satisfies { [m: string]: readonly [opcode: number, (state: State<Inst, Expr>) => void] };

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

export const JUMPDEST = 0x5b;

function getJumpDest(offset: Expr, opcode: Opcode, bytecode: Uint8Array): number {
    const offset2 = offset.eval();
    if (!offset2.isVal()) {
        throw new ExecError(`${opcode.format()} offset should be numeric but found '${offset.tag}'`);
    }
    const destpc = Number(offset2.val);
    if (bytecode[destpc] === JUMPDEST) {
        (offset as Val).jumpDest = destpc;
        return destpc;
    } else {
        throw new ExecError(`${opcode.format()} destination should be JUMPDEST@${destpc} but ${bytecode[destpc] === undefined
            ? `'${destpc}' is out-of-bounds`
            : `found '0x${bytecode[destpc]?.toString(16)}'`
            }`);
    }
}

const FrontierStep = {
    POP: [0x50, function pop({ stack }: Operand<Expr>) {
        const expr = stack.pop();
        if (expr.tag === 'Local') {
            // expr.nrefs--;
            // console.log('POP: Local', expr);
            // throw new Error('POP: Local');
        }
    }] as const,

    ...Object.fromEntries([...Array(32).keys()].map(size => [
        `PUSH${(size + 1 as Size<32>)}`, [
            { opcode: 0x60 + size, size: size + 1 },
            ({ stack }: Operand<Expr>, opcode: Opcode) => stack.push(new Val(BigInt('0x' + opcode.hexData()), true))
        ]
    ] as const)),

    ...Object.fromEntries([...Array(16).keys()].map(position => [
        `DUP${(position + 1 as Size<16>)}`,
        [0x80 + position, (state: State<Inst, Expr>) => {
            if (position >= state.stack.values.length) {
                throw new ExecError('Invalid duplication operation, position was not found');
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
        }]
    ] as const)),

    ...Object.fromEntries([...Array(16).keys()].map(position => [
        `SWAP${(position + 1 as Size<16>)}`,
        [0x90 + position, ({ stack }: Operand<Expr>) => stack.swap(position + 1)]
    ] as const)),

    ...Object.fromEntries(([
        ['ADD', 0x01, Add],
        ['MUL', 0x02, Mul],
        ['SUB', 0x03, Sub],
        ['DIV', 0x04, Div],
        ['SDIV', 0x05, Div],
        ['MOD', 0x06, Mod],
        ['SMOD', 0x07, Mod],
        ['EXP', 0x0a, Exp],
        ['LT', 0x10, Lt],
        ['GT', 0x11, Gt],
        ['SLT', 0x12, Lt],
        ['SGT', 0x13, Gt],
        ['AND', 0x16, And],
        ['OR', 0x17, Or],
        ['XOR', 0x18, Xor],
    ] as const).map(([mnemonic, opcode, Cons]) => [mnemonic, [opcode, ({ stack }: Operand<Expr>) => {
        const lhs = stack.pop();
        const rhs = stack.pop();
        stack.push(new Cons(lhs, rhs));
    }]])),

    ...ALU,
    ...SPECIAL,
    ...Object.fromEntries(Object.entries(FNS).map(([m, [, , o]]) => [m, [
        o, ({ stack }) => stack.push(new Fn(m, stack.pop()))
    ]])),
    ...DATACOPY,

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
    MSIZE: [0x59, ({ stack }) => stack.push(new Prop('msize()', 'uint'))],

    SHA3: [0x20, state => state.stack.push(memArgs(state, Sha3))],
    STOP: [{ opcode: 0x00, halts: true }, state => state.halt(new Stop())],
    CREATE: [0xf0, function create({ stack, memory }) {
        const value = stack.pop();
        const offset = stack.pop();
        const size = stack.pop();
        stack.push(new Create(value, offset, size, ((offset, size) => {
            if (offset.isVal() && size.isVal() && Number(offset.val) in memory) {
                const data = memory[Number(offset.val)];
                if (data.tag === 'DataCopy' && data.bytecode !== undefined && data.bytecode.length === Number(size.val)) {
                    return data.bytecode;
                }
            }
            return null;
        })(offset.eval(), size.eval())));
    }],
    CALL: [0xf1, function call({ stack, memory }) {
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
    CALLCODE: [0xf2, function callcode({ stack }) {
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
    DELEGATECALL: [0xf4, function delegatecall({ stack }) {
        const gas = stack.pop();
        const address = stack.pop();
        const argsStart = stack.pop();
        const argsLen = stack.pop();
        const retStart = stack.pop();
        const retLen = stack.pop();
        stack.push(new DelegateCall(gas, address, argsStart, argsLen, retStart, retLen));
    }],
    STATICCALL: [0xfa, function staticcall({ stack }) {
        const gas = stack.pop();
        const address = stack.pop();
        const argsStart = stack.pop();
        const argsLen = stack.pop();
        const retStart = stack.pop();
        const retLen = stack.pop();
        stack.push(new StaticCall(gas, address, argsStart, argsLen, retStart, retLen));
    }],
    REVERT: [{ opcode: 0xfd, halts: true }, state => state.halt(memArgs(state, Revert))],
    SELFDESTRUCT: [{ opcode: 0xff, halts: true }, function selfdestruct(state) {
        const address = state.stack.pop();
        state.halt(new SelfDestruct(address));
    }],

    PC: [0x58, ({ stack }, op) => stack.push(new Val(BigInt(op.pc)))],
    INVALID: [{ opcode: 0xfe, halts: true }, (state, op) => state.halt(new Invalid(op.opcode))],

    LOG0: log(0),
    LOG1: log(1),
    LOG2: log(2),
    LOG3: log(3),
    LOG4: log(4),

    ...STORAGE,
    JUMPDEST: [JUMPDEST, _state => { }],
    JUMP: [0x56, function (state, opcode, bytecode) {
        const offset = state.stack.pop();
        const destpc = getJumpDest(offset, opcode, bytecode);
        const destBranch = Branch.make(destpc, state);
        state.halt(new Jump(offset, destBranch));
    }],
    JUMPI: [0x57, function (this: Members, state, opcode, bytecode) {
        const offset = state.stack.pop();
        const cond = state.stack.pop();
        const destpc = getJumpDest(offset, opcode, bytecode);

        const fallBranch = Branch.make(opcode.pc + 1, state);

        let last: SigCase | Jumpi;
        if (cond.tag === 'Sig') {
            this.functionBranches.set(cond.selector, {
                pc: destpc,
                state: state.clone(),
            });
            last = new SigCase(cond, offset, fallBranch);
        } else {
            last = new Jumpi(cond, offset, fallBranch, Branch.make(destpc, state));
        }
        state.halt(last);
    }],
} satisfies Step;

/**
 * `EXTCODEHASH` implemented in `FNS`.
 * https://eips.ethereum.org/EIPS/eip-1052
 */
const ConstantinopleStep = {
    ...FrontierStep,

    ...Object.fromEntries([
        ['SHL', 0x1b, Shl] as const,
        ['SHR', 0x1c, Shr] as const,
        ['SAR', 0x1d, Sar] as const,
    ].map(([mnemonic, opcode, Cons]) => [mnemonic, [opcode, ({ stack }: Operand<Expr>) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(new Cons(value, shift));
    }]] as const)),

    CREATE2: [0xf5, function create2({ stack }) {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new Create2(memoryStart, memoryLength, value));
    }] as const,
} satisfies Step;

const IstanbulStep = {
    ...ConstantinopleStep,
    CHAINID: [0x46, prop('block.chainid')] as const,
    SELFBALANCE: [0x47, prop('address(this).balance')] as const,
} satisfies Step;

const LondonStep = {
    ...IstanbulStep,
    BASEFEE: [0x48, prop('block.basefee')] as const,
};

const ParisStep = {
    ...LondonStep,
    PREVRANDAO: [0x44, prop('block.prevrandao')],
} satisfies Step;

const ShanghaiStep = {
    ...ParisStep,
    PUSH0: [0x5f, ({ stack }: Operand<Expr>) => stack.push(new Val(0n, true))],
} satisfies Step;

/**
 * 
 */
function ForkFactory<U extends Step>(steps: U) {
    const lookup = Object.fromEntries(
        Object.entries(steps).map(([m, [o,]]) => typeof o === 'number'
            ? [o, [0, false, m]] as const
            : [o.opcode, [o.size ?? 0, !!o.halts, m]] as const
        ));

    class Fork extends Undef<keyof U & string> {
        constructor() {
            super();
            Object.assign(this, lookup);
        }
    }

    const props = Object.fromEntries(Object.entries(steps).map(([m, value]) => [m, value[1]]));
    Object.assign(Fork.prototype, props);

    return Fork as unknown as new () => InstanceType<typeof Fork> & { readonly [m in keyof U]: U[m][1] };
}

/**
 * https://eips.ethereum.org/EIPS/eip-3198
 * 
 * Keep track of https://eips.ethereum.org/EIPS/eip-4200
 */
export const London = ForkFactory(LondonStep);

/**
 * Defines the `Paris` hardfork.
 * It includes the `PREVRANDAO` instruction.
 * 
 * Solidity `0.8.18` includes _Support for Paris Hardfork_, 
 * which introduces the global `block.prevrandao` built-in in Solidity and `prevrandao()`
 * instruction in inline assembly and Yul for EVM versions >= Paris.
 * 
 * @see https://ethereum.github.io/execution-specs/diffs/gray_glacier_paris.html 
 * @see https://eips.ethereum.org/EIPS/eip-4399
 * @see https://soliditylang.org/blog/2023/02/01/solidity-0.8.18-release-announcement
 */
export const Paris = ForkFactory(ParisStep);

/**
 * Defines the `Shanghai` hardfork.
 * It includes the `PUSH0` instruction.
 * 
 * Solidity `0.8.20` uses `push0` for placing `0` on the Stack.
 * This decreases the deployment and runtime costs.
 * 
 * Keep track of https://eips.ethereum.org/EIPS/eip-6780
 * 
 * @see https://ethereum.github.io/execution-specs/diffs/paris_shanghai.html
 * @see https://eips.ethereum.org/EIPS/eip-3855
 * @see https://soliditylang.org/blog/2023/05/10/solidity-0.8.20-release-announcement/
 */
export const Shanghai = ForkFactory(ShanghaiStep);
