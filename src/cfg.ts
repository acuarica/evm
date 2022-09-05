import { INFO } from './inst/info';
import { LOGIC } from './inst/logic';
import { MATH } from './inst/math';
import { MEMORY } from './inst/memory';
import { SHA3 } from './inst/sha3';
import { STORAGE } from './inst/storage';
import { SYMBOLS } from './inst/symbols';
import { INVALID, SYSTEM } from './inst/system';
import { formatOpcode, Opcode } from './opcode';
import { PUSHES, STACK } from './inst/core';
import { LOGS } from './inst/log';
import { Stack } from './stack';
import { State } from './state';
import { Contract } from './contract';
import { Expr, isBigInt, Jump, Jumpi, Stmt } from './ast';

export class Block {
    constructor(
        readonly key: string,
        readonly opcodes: Opcode[],
        readonly stack: State['stack'],
        // readonly memory: State['memory'],
        public stmts: State['stmts']
    ) {}

    get entry(): Opcode {
        return this.opcodes[0];
    }

    get exit(): Opcode {
        return this.opcodes[this.opcodes.length - 1];
    }
}

export type ControlFlowGraph = { blocks: { [pc: string]: Block }; entry: string };

function make<F, T extends { [mnemonic: string]: F }>(
    table: T,
    adapter: (fn: F) => (opcode: Opcode, state: State) => void
) {
    return Object.fromEntries(
        Object.entries(table).map(([mnemonic, fn]) => [mnemonic, adapter(fn)])
    ) as { [mnemonic in keyof T]: (opcode: Opcode, state: State) => void };
}

function makeStack<T extends { [mnemonic: string]: (stack: Stack<Expr>) => void }>(table: T) {
    return make(table, (fn: (stack: Stack<Expr>) => void) => (_opcode, state) => fn(state.stack));
}

function makeState<T extends { [mnemonic: string]: (state: State) => void }>(table: T) {
    return make(table, (fn: (state: State) => void) => (_opcode, state) => fn(state));
}

const TABLE = {
    ...makeStack(MATH),
    ...makeStack(LOGIC),
    ...SHA3,
    ...makeStack(INFO),
    ...SYMBOLS,
    ...makeState(MEMORY),
    PC: (opcode: Opcode, { stack }: State) => stack.push(BigInt(opcode.offset)),
    JUMPDEST: (_opcode: Opcode, _state: State) => {},
    ...make(
        PUSHES(),
        (fn: (pushData: Uint8Array, stack: Stack<Expr>) => void) => (opcode, state) =>
            fn(opcode.pushData!, state.stack)
    ),
    ...makeStack(STACK<Expr>()),
    ...makeState(SYSTEM),
    INVALID,
};

export function getBlocks(opcodes: Opcode[], contract: Contract): ControlFlowGraph {
    const pcs: { path: number[]; state: State }[] = [{ path: [0], state: new State() }];

    const table = {
        ...TABLE,
        ...STORAGE(contract),
        ...LOGS(contract),
        // ...JUMPS(opcodes, pcs),
    };

    const cfg: ControlFlowGraph['blocks'] = {};
    while (pcs.length > 0) {
        // The non-null assertion operator `!` is needed here because the
        // guard `length === 0` does not track array's emptiness.
        // See https://github.com/microsoft/TypeScript/issues/30406.
        const { path, state } = pcs.pop()!;
        const key = path.join('->');
        if (!(key in cfg) || cfg[key].stack.values.join('|') !== state.stack.values.join('|')) {
            // if (!(key in cfg)) {
            const bb: Opcode[] = [];
            for (let pc = path.at(-1)!; !state.halted && pc < opcodes.length; pc++) {
                const opcode = opcodes[pc];

                if (opcode.mnemonic === 'JUMP') {
                    const offset = state.stack.pop();
                    if (isBigInt(offset)) {
                        const dest = opcodes.find(o => o.offset === Number(offset))!;
                        if (dest && dest.mnemonic === 'JUMPDEST') {
                            pc = dest.pc;
                            continue;
                        } else {
                            break;
                        }
                        break;
                    }
                }

                bb.push(opcode);

                const branch = (pc: number, state: State) => {
                    if (path.includes(pc)) {
                        return path.join('->');
                    }

                    const branchPath = [...path, pc];
                    pcs.push({ path: branchPath, state: state.clone() });
                    return branchPath.join('->');
                };

                if (opcode.mnemonic === 'JUMP') {
                    const offset = state.stack.pop();
                    if (isBigInt(offset)) {
                        const dest = opcodes.find(o => o.offset === Number(offset))!;
                        if (dest && dest.mnemonic === 'JUMPDEST') {
                            // pc = dest.pc;
                            const destBranch = branch(dest.pc, state);
                            state.stmts.push(new Jump(offset, destBranch));
                            state.halted = true;
                            continue;
                        } else {
                            break;
                        }
                    }
                } else if (opcode.mnemonic === 'JUMPI') {
                    const offset = state.stack.pop();
                    const condition = state.stack.pop();

                    if (isBigInt(offset)) {
                        const dest = opcodes.find(o => o.offset === Number(offset))!;
                        if (dest) {
                            const fallBranch = branch(opcode.pc + 1, state);
                            const destBranch = branch(dest.pc, state);
                            state.stmts.push(new Jumpi(condition, offset, fallBranch, destBranch));
                            state.halted = true;
                            continue;
                        }
                    }

                    state.stmts.push(new Jumpi(condition, offset));
                    state.halted = true;
                    continue;
                }

                try {
                    table[opcode.mnemonic as keyof typeof table](opcode, state);
                } catch (err) {
                    throw new Error(
                        '`' +
                            err +
                            `\` at [${opcode.offset}] ${
                                opcode.mnemonic
                            } =| ${state.stack.values.join(' | ')}`
                    );
                }
            }

            cfg[key] = new Block(key, bb, state.stack, state.stmts);
        }
    }

    // inlineBlocks(cfg, '0');

    return { blocks: cfg, entry: '0' };
}

export function inlineBlocks(blocks: ControlFlowGraph['blocks'], entry: string) {
    for (const from in blocks) {
        const seen: string[] = [];
        blocks[from].stmts = inlineBlock(blocks, from, seen);
    }

    function inlineBlock(blocks: ControlFlowGraph['blocks'], from: string, seen: string[]): Stmt[] {
        const { stmts } = blocks[from];
        if (
            !seen.includes(from) &&
            stmts.length === 1 &&
            stmts[0] instanceof Jump &&
            stmts[0].destBranch
        ) {
            seen.push(from);
            return inlineBlock(blocks, stmts[0].destBranch, seen);
        } else {
            return stmts;
        }
    }

    const keys = Object.keys(blocks).filter(key => key !== entry);
    for (const key of keys) {
        if (!isReachable(key, blocks)) {
            delete blocks[key];
        }
    }
}

function isReachable(key: string, blocks: ControlFlowGraph['blocks']) {
    for (const block of Object.values(blocks)) {
        const last = block.stmts.at(-1);
        if (
            (last instanceof Jump && last.destBranch === key) ||
            (last instanceof Jumpi && [last.destBranch, last.fallBranch].includes(key))
        ) {
            return true;
        }
    }

    return false;
}

// export function JUMPS(opcodes: Opcode[], pcs: { pc: number[]; state: State }[]) {
//     const branch = (_from: number, pc: number, state: State) =>
//         pcs.push({ pc: [pc], state: state.clone() });

//     return {
//         JUMPI: (opcode: Opcode, state: State) => {
//             const offset = state.stack.pop();
//             const condition = state.stack.pop();

//             if (isBigInt(offset)) {
//                 const dest = opcodes.find(o => o.offset === Number(offset))!;
//                 if (dest) {
//                     branch(opcode.pc, opcode.pc + 1, state);
//                     branch(opcode.pc, dest.pc, state);
//                 }
//             }

//             state.stmts.push(new Jumpi(condition, offset));
//             state.halted = true;
//         },

//         JUMP: (opcode: Opcode, state: State) => {
//             const offset = state.stack.pop();

//             let pc: number | null = null;
//             if (isBigInt(offset)) {
//                 const dest = opcodes.find(o => o.offset === Number(offset))!;
//                 if (dest) {
//                     pc = dest.pc;
//                     branch(opcode.pc, dest.pc, state);
//                 }
//             }

//             state.stmts.push(new Jump(offset, pc));
//             state.halted = true;
//         },
//     };
// }

export function pprint({ blocks }: ControlFlowGraph) {
    for (const [pc, block] of Object.entries(blocks)) {
        console.log(pc, ':', block.entry.offset);
        block.opcodes.forEach(op => console.log('  ', formatOpcode(op)));
        console.log('  =| ', block.stack.values.join(' | '));
        block.stmts.forEach(stmt => console.log('  ', stmt.toString()));
    }
}
