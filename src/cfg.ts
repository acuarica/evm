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
import { Expr } from './inst/utils';

export class Block {
    constructor(
        readonly opcodes: Opcode[],
        readonly stack: State['stack'],
        readonly memory: State['memory'],
        readonly stmts: State['stmts']
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
    const pcs: { from: number; pc: number; state: State }[] = [
        { from: 0, pc: 0, state: new State() },
    ];

    const table = {
        ...TABLE,
        ...STORAGE(contract),
        ...LOGS(contract),
        ...JUMPS(opcodes, pcs),
    };

    const cfg: ControlFlowGraph['blocks'] = {};
    while (pcs.length > 0) {
        // The non-null assertion operator `!` is needed here because the
        // guard `length === 0` does not track array's emptiness.
        // See https://github.com/microsoft/TypeScript/issues/30406.
        const { from, pc: pc0, state } = pcs.pop()!;
        // if (!(pc0 in cfg) || cfg[pc0].stack.values.join('|') !== state.stack.values.join('|')) {
        const key = from + ':' + pc0;
        if (!(key in cfg)) {
            const bb: Opcode[] = [];

            for (let pc = pc0; !state.halted && pc < opcodes.length; pc++) {
                const opcode = opcodes[pc];

                if (opcode.mnemonic === 'JUMP') {
                    const offset = state.stack.pop();
                    const dest = opcodes.find(o => o.offset === Number(offset))!;
                    if (dest && dest.mnemonic === 'JUMPDEST') {
                        pc = dest.pc;
                        continue;
                    } else {
                        break;
                    }
                }

                bb.push(opcode);
                try {
                    table[opcode.mnemonic](opcode, state);
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

            cfg[key] = new Block(bb, state.stack, state.memory, state.stmts);
        }
    }

    return { blocks: cfg, entry: '0:0' };
}

export class Jumpi {
    readonly name = 'Jumpi';
    readonly wrapped = true;
    constructor(readonly condition: Expr, readonly offset: Expr, readonly pc: number | null) {}
    toString() {
        // return 'if (' + this.condition + ') // goto ' + this.offset.toString();
        return 'if (' + this.condition + ')';
    }
}

export class Jump {
    readonly name = 'Jump';
    readonly wrapped = true;
    constructor(readonly offset: Expr, readonly pc: number | null) {}
    toString() {
        return 'go ' + this.offset.toString();
    }
}

function JUMPS(opcodes: Opcode[], pcs: { from: number; pc: number; state: State }[]) {
    const branch = (from: number, pc: number, state: State) =>
        pcs.push({ from, pc, state: state.clone() });

    return {
        JUMPI: (opcode: Opcode, state: State) => {
            const offset = state.stack.pop();
            const condition = state.stack.pop();

            let pc: number | null = null;
            if (typeof offset === 'bigint') {
                const dest = opcodes.find(o => o.offset === Number(offset))!;
                if (dest) {
                    pc = dest.pc;
                    branch(opcode.pc, opcode.pc + 1, state);
                    branch(opcode.pc, dest.pc, state);
                }
            }

            state.stmts.push(new Jumpi(condition, offset, pc));
            state.halted = true;
        },

        JUMP: (opcode: Opcode, state: State) => {
            const offset = state.stack.pop();

            let pc: number | null = null;
            if (typeof offset === 'bigint') {
                const dest = opcodes.find(o => o.offset === Number(offset))!;
                if (dest) {
                    pc = dest.pc;
                    branch(opcode.pc, dest.pc, state);
                }
            }

            state.stmts.push(new Jump(offset, pc));
            state.halted = true;
        },
    };
}

export function pprint({ blocks }: ControlFlowGraph) {
    for (const [pc, block] of Object.entries(blocks)) {
        console.log(pc, ':', block.entry.offset);
        block.opcodes.forEach(op => console.log('  ', formatOpcode(op)));
        console.log('  =| ', block.stack.values.join(' | '));
        block.stmts.forEach(stmt => console.log('  ', stmt.toString()));
    }
}
