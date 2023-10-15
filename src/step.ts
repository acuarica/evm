import { type Opcode, type decode, formatOpcode, toHex } from './opcode';
import type { Ram, Stack, State } from './state';

import { type Expr, Val, type Inst } from './ast/expr';
import { Add, Div, Exp, Mod, Mul, Sub } from './ast/math';
import { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './ast/logic';
import { mapValues } from './object';
import { CallDataLoad, CallValue, DataCopy, FNS, Fn, Info } from './ast/special';
import { MLoad, MStore } from './ast/memory';
import {
    Call,
    CallCode,
    Create,
    Create2,
    DelegateCall,
    Invalid,
    Return,
    ReturnData,
    Revert,
    SelfDestruct,
    Sha3,
    StaticCall,
    Stop,
} from './ast/system';
import { Branch, Jump, Jumpi, SigCase } from './ast/flow';
import { type IEvents, Log } from './ast/log';
import { type IStore, MappingLoad, MappingStore, SLoad, SStore, Variable } from './ast/storage';

export type Step = Omit<
    ReturnType<typeof STEP>,
    'events' | 'functionBranches' | 'variables' | 'mappings'
>;

/**
 * Store selectors starting point.
 */
export type ISelectorBranches = Map<string, { pc: number; state: State<Inst, Expr> }>;

export function STEP(
    { opcodes, jumpdests }: ReturnType<typeof decode> = { opcodes: [], jumpdests: {} }
) {
    const mapStack = <K extends string>(table: { [mnemonic in K]: (stack: Stack<Expr>) => void }) =>
        mapValues(table, fn => (state: State<Inst, Expr>) => fn(state.stack));

    const events: IEvents = {};
    const { variables, mappings }: IStore = { variables: {}, mappings: {} };
    const functionBranches: ISelectorBranches = new Map<
        string,
        { pc: number; state: State<Inst, Expr> }
    >();

    return {
        events,
        variables,
        mappings,
        functionBranches,
        ...mapStack(MATH),
        ...mapStack(LOGIC),
        ...SPECIAL,
        ...MEMORY,
        JUMPDEST: (_state: State<Inst, Expr>) => {},
        ...mapValues(PUSHES, fn => (s: State<Inst, Expr>, o: Opcode) => fn(o.pushData!, s.stack)),
        ...mapStack(STACK),
        ...SYSTEM,
        PC: ({ stack }: State<Inst, Expr>, op: Opcode) => stack.push(new Val(BigInt(op.offset))),
        INVALID: (state: State<Inst, Expr>, op: Opcode): void => state.halt(new Invalid(op.opcode)),
        ...FLOW({ opcodes, jumpdests }, functionBranches),
        ...STORAGE({ variables, mappings }),
        ...LOGS(events),
    } as const;
}

const push = (d: Uint8Array, s: Stack<Expr>) => s.push(new Val(BigInt('0x' + toHex(d)), true));
const dup = (position: number) => (stack: Stack<Expr>) => stack.dup(position);
const swap = (position: number) => (stack: Stack<Expr>) => stack.swap(position);

function bin(Cons: new (lhs: Expr, rhs: Expr) => Expr): (stack: Stack<Expr>) => void {
    return function (stack: Stack<Expr>) {
        const lhs = stack.pop();
        const rhs = stack.pop();
        stack.push(new Cons(lhs, rhs));
    };
}

function shift(Cons: new (value: Expr, shift: Expr) => Expr): (stack: Stack<Expr>) => void {
    return function (stack: Stack<Expr>) {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(new Cons(value, shift));
    };
}

const PUSHES = {
    PUSH1: push,
    PUSH2: push,
    PUSH3: push,
    PUSH4: push,
    PUSH5: push,
    PUSH6: push,
    PUSH7: push,
    PUSH8: push,
    PUSH9: push,
    PUSH10: push,
    PUSH11: push,
    PUSH12: push,
    PUSH13: push,
    PUSH14: push,
    PUSH15: push,
    PUSH16: push,
    PUSH17: push,
    PUSH18: push,
    PUSH19: push,
    PUSH20: push,
    PUSH21: push,
    PUSH22: push,
    PUSH23: push,
    PUSH24: push,
    PUSH25: push,
    PUSH26: push,
    PUSH27: push,
    PUSH28: push,
    PUSH29: push,
    PUSH30: push,
    PUSH31: push,
    PUSH32: push,
} as const;

const STACK = {
    POP: (stack: Stack<Expr>): void => void stack.pop(),
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
} as const;

const MATH = {
    ADD: bin(Add),
    MUL: bin(Mul),
    SUB: bin(Sub),
    DIV: bin(Div),
    SDIV: bin(Div),
    MOD: bin(Mod),
    SMOD: bin(Mod),
    ADDMOD: (stack: Stack<Expr>): void => {
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
    },
    MULMOD: (stack: Stack<Expr>): void => {
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
    },
    EXP: bin(Exp),
    SIGNEXTEND: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            left.isVal() && right.isVal()
                ? new Val((right.val << (32n - left.val)) >> (32n - left.val))
                : left.isVal()
                ? new Sar(new Shl(right, new Val(32n - left.val)), new Val(32n - left.val))
                : new Sar(new Shl(right, new Sub(new Val(32n), left)), new Sub(new Val(32n), left))
        );
    },
} as const;

const LOGIC = {
    LT: bin(Lt),
    GT: bin(Gt),
    SLT: bin(Lt),
    SGT: bin(Gt),
    EQ: (stack: Stack<Expr>): void => {
        const DIVEXPsig = (left: Expr, right: Expr, orElse: () => Sig | Eq) => {
            left = left.eval();
            right = right.eval();

            if (left.isVal() && right.tag === 'Div' && right.right.isVal()) {
                const selector = left.val * right.right.val;
                right = right.left;

                if (
                    selector % (1n << 0xe0n) === 0n &&
                    right.tag === 'CallDataLoad' &&
                    right.location.isZero()
                ) {
                    return new Sig(
                        selector
                            .toString(16)
                            .substring(0, 8 - (64 - selector.toString(16).length))
                            .padStart(8, '0')
                    );
                }
            }

            return orElse();
        };

        const SHRsig = (left: Expr, right: Expr, orElse: () => Sig | Eq) =>
            left.isVal() &&
            right.tag === 'Shr' &&
            right.shift.isVal() &&
            right.shift.val === 0xe0n &&
            right.value.tag === 'CallDataLoad' &&
            right.value.location.isZero()
                ? new Sig(left.val.toString(16).padStart(8, '0'))
                : orElse();

        const left = stack.pop();
        const right = stack.pop();

        stack.push(
            left.isVal() && right.isVal()
                ? left.val === right.val
                    ? new Val(1n)
                    : new Val(0n)
                : DIVEXPsig(left, right, () =>
                      DIVEXPsig(right, left, () =>
                          SHRsig(left, right, () => SHRsig(right, left, () => new Eq(left, right)))
                      )
                  )
        );
    },
    ISZERO: (stack: Stack<Expr>): void => {
        const value = stack.pop();
        stack.push(new IsZero(value));
    },
    AND: bin(And),
    OR: bin(Or),
    XOR: bin(Xor),
    NOT: (stack: Stack<Expr>): void => {
        const value = stack.pop();
        stack.push(new Not(value));
    },
    BYTE: (stack: Stack<Expr>): void => {
        const position = stack.pop();
        const data = stack.pop();
        stack.push(new Byte(position, data));
    },
    SHL: shift(Shl),
    SHR: shift(Shr),
    SAR: shift(Sar),
} as const;

const mapKeys = <K extends string, U>(o: { [k in K]: unknown }, fn: (k: K) => U) =>
    Object.fromEntries(Object.keys(o).map(k => [k, fn(k)]));

const SPECIAL = {
    ...mapValues(Info, sym => state => state.stack.push(sym)),
    ...mapKeys(FNS, n => state => state.stack.push(new Fn(n, state.stack.pop()))),
    CALLVALUE: ({ stack }) => stack.push(new CallValue()),
    CALLDATALOAD: ({ stack }) => stack.push(new CallDataLoad(stack.pop())),
    CALLDATACOPY: state => datacopy('calldatacopy')(state),
    CODECOPY: state => datacopy('codecopy')(state),
    EXTCODECOPY: state => {
        const address = state.stack.pop();
        datacopy('extcodecopy')(state, address);
    },
    RETURNDATACOPY: state => datacopy('returndatacopy')(state),
} as const satisfies { [mnemonic: string]: (state: Ram<Expr>) => void };

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
    };
}

const MEMORY = {
    MLOAD: ({ stack, memory }: State<Inst, Expr>): void => {
        let loc = stack.pop();
        loc = loc.eval();
        stack.push(
            loc.isVal() && Number(loc.val) in memory ? memory[Number(loc.val)] : new MLoad(loc)
        );
    },
    MSTORE: mstore,
    MSTORE8: mstore,
} as const;

function mstore({ stack, memory, stmts }: State<Inst, Expr>): void {
    let loc = stack.pop();
    const data = stack.pop();

    loc = loc.eval();
    if (loc.isVal()) {
        memory[Number(loc.val)] = data;
    } else {
        stmts.push(new MStore(loc, data));
    }
}

const SYSTEM = {
    SHA3: state => state.stack.push(memArgs(state, Sha3)),
    STOP: state => state.halt(new Stop()),
    CREATE: ({ stack }) => {
        const value = stack.pop();
        const offset = stack.pop();
        const size = stack.pop();
        stack.push(new Create(value, offset, size));
    },
    CALL: ({ stack, memory }) => {
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
    },
    CALLCODE: ({ stack }) => {
        const gas = stack.pop();
        const address = stack.pop();
        const value = stack.pop();
        const argsStart = stack.pop();
        const argsLen = stack.pop();
        const retStart = stack.pop();
        const retLen = stack.pop();
        stack.push(new CallCode(gas, address, value, argsStart, argsLen, retStart, retLen));
    },
    RETURN: state => state.halt(memArgs(state, Return)),
    DELEGATECALL: ({ stack }) => {
        const gas = stack.pop();
        const address = stack.pop();
        const argsStart = stack.pop();
        const argsLen = stack.pop();
        const retStart = stack.pop();
        const retLen = stack.pop();
        stack.push(new DelegateCall(gas, address, argsStart, argsLen, retStart, retLen));
    },
    CREATE2: ({ stack }) => {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new Create2(memoryStart, memoryLength, value));
    },
    STATICCALL: ({ stack }) => {
        const gas = stack.pop();
        const address = stack.pop();
        const argsStart = stack.pop();
        const argsLen = stack.pop();
        const retStart = stack.pop();
        const retLen = stack.pop();
        stack.push(new StaticCall(gas, address, argsStart, argsLen, retStart, retLen));
    },
    REVERT: state => state.halt(memArgs(state, Revert)),
    SELFDESTRUCT: state => {
        const address = state.stack.pop();
        state.halt(new SelfDestruct(address));
    },
} as const satisfies { [mnemonic: string]: (state: State<Inst, Expr>) => void };

function memArgs<T>(
    { stack, memory }: State<Inst, Expr>,
    Klass: new (offset: Expr, size: Expr, args?: Expr[]) => T
): T {
    const MAXSIZE = 1024;

    const offset = stack.pop();
    const size = stack.pop();

    return new Klass(
        offset,
        size,
        (function (offset, size) {
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
        })(offset.eval(), size.eval())
    );
}

function FLOW(
    { opcodes, jumpdests }: ReturnType<typeof decode>,
    functionBranches: ISelectorBranches
) {
    return {
        JUMP: (state: State<Inst, Expr>, opcode: Opcode): void => {
            const offset = state.stack.pop();
            const destpc = getDest(offset, opcode);
            const destBranch = Branch.make(destpc, state);
            state.halt(new Jump(offset, destBranch));
        },

        JUMPI: (state: State<Inst, Expr>, opcode: Opcode): void => {
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
        },
    } as const;

    /**
     * @param offset
     * @param opcode Only used for error reporting.
     */
    function getDest(offset: Expr, opcode: Opcode): number {
        const offset2 = offset.eval();
        if (!offset2.isVal()) {
            throw new Error(`Numeric offset not found on stack @${formatOpcode(opcode)}`);
        }
        const destpc = jumpdests[Number(offset2.val)];
        if (destpc !== undefined) {
            (offset as Val).jumpDest = destpc;
            return destpc;
        } else {
            const dest = opcodes.find(o => o.offset === Number(offset2.val));
            if (!dest) {
                throw new Error(`Expected JUMPDEST, but found ${formatOpcode(opcode)}`);
            }
            throw new Error(`JUMP destination should be JUMPDEST but found @${formatOpcode(dest)}`);
        }
    }
}

function LOGS(events: IEvents) {
    return {
        LOG0: log(0, events),
        LOG1: log(1, events),
        LOG2: log(2, events),
        LOG3: log(3, events),
        LOG4: log(4, events),
    } as const;

    function log(topicsCount: number, events: IEvents) {
        return ({ stack, memory, stmts }: State<Inst, Expr>): void => {
            let offset = stack.pop();
            let size = stack.pop();

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

            offset = offset.eval();
            size = size.eval();
            const getArgs = (offset: Val, size: Val) => {
                const args = [];
                for (let i = Number(offset.val); i < Number(offset.val + size.val); i += 32) {
                    args.push(i in memory ? memory[i] : new MLoad(new Val(BigInt(i))));
                }
                return args;
            };
            const args = offset.isVal() && size.isVal() ? getArgs(offset, size) : undefined;
            stmts.push(new Log(event, topics, { offset, size }, args));
        };
    }
}

function STORAGE({ variables, mappings }: IStore) {
    return {
        SLOAD: ({ stack }: State<Inst, Expr>): void => {
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
        },

        SSTORE: ({ stack, stmts }: State<Inst, Expr>): void => {
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
        },
    };

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
