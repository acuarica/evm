import { EVM } from './evm';
import { INFO } from './inst/info';
import { LOGIC } from './inst/logic';
import { MATH } from './inst/math';
import { MEMORY } from './inst/memory';
import { SHA3 } from './inst/sha3';
import { STORAGE } from './inst/storage';
import { SYMBOLS } from './inst/symbols';
import { INVALID, SYSTEM } from './inst/system';
import { formatOpcode, Opcode } from './opcode';
import { DUPS, PUSHES, SWAPS } from './inst/core';
import { LOGS } from './inst/log';
import { Stack } from './stack';
import { Operand, State } from './state';

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

export type ControlFlowGraph = { [pc: number]: Block };

function wrap2<F, T extends { [mnemonic: string]: F }>(
    table: T,
    adapter: (fn: F) => (opcode: Opcode, state: State) => void
) {
    return Object.fromEntries(
        Object.entries(table).map(([mnemonic, fn]) => [mnemonic, adapter(fn)])
    ) as { [mnemonic in keyof T]: (opcode: Opcode, state: State) => void };
}

function wrap<T extends { [mnemonic: string]: (stack: Stack<Operand>) => void }>(table: T) {
    return wrap2(
        table,
        (fn: (stack: Stack<Operand>) => void) => (_opcode, state) => fn(state.stack)
    );
}

const TABLE = {
    ...wrap(MATH),
    ...wrap(LOGIC),
    ...SHA3,
    ...INFO,
    ...SYMBOLS,
    POP: (_opcode: Opcode, { stack }: State) => stack.pop(),
    ...MEMORY,
    PC: (opcode: Opcode, { stack }: State) => stack.push(BigInt(opcode.offset)),
    JUMPDEST: (_opcode: Opcode, _state: State) => {
        /* Empty */
    },
    ...wrap2(
        PUSHES,
        (fn: (pushData: Uint8Array, state: State) => void) => (opcode, state) =>
            fn(opcode.pushData!, state)
    ),
    ...wrap(DUPS<Operand>()),
    ...wrap(SWAPS<Operand>()),
    ...wrap2(SYSTEM, (fn: (state: State) => void) => (_opcode, state) => fn(state)),
    INVALID,
};

export function getBlocks(evm: EVM): ControlFlowGraph {
    const pcs: { pc: number; state: State }[] = [{ pc: 0, state: new State() }];
    const opcodes = evm.opcodes;

    const table = {
        ...TABLE,
        ...STORAGE(evm),
        ...LOGS(evm),
        ...JUMPS(evm.opcodes, pcs),
    };

    const cfg: ControlFlowGraph = {};
    while (pcs.length > 0) {
        // The non-null assertion operator `!` is needed here because the
        // guard `length === 0` does not track array's emptiness.
        // See https://github.com/microsoft/TypeScript/issues/30406.
        const { pc: pc0, state } = pcs.pop()!;
        if (!(pc0 in cfg)) {
            const bb: Opcode[] = [];

            for (let pc = pc0; !state.halted && pc < opcodes.length; pc++) {
                const opcode = opcodes[pc];
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

            cfg[pc0] = new Block(bb, state.stack, state.memory, state.stmts);
        }
    }

    return cfg;
}

export class Jumpi {
    readonly name = 'Jumpi';
    readonly wrapped = true;
    constructor(
        readonly condition: Operand,
        readonly offset: Operand,
        readonly pc: number | null
    ) {}
    toString() {
        return 'if (' + this.condition + ') // goto ' + this.offset.toString();
    }
}

export class Jump {
    readonly name = 'Jump';
    readonly wrapped = true;
    constructor(readonly offset: Operand, readonly pc: number | null) {}
    toString() {
        return 'go ' + this.offset.toString();
    }
}

function JUMPS(opcodes: Opcode[], pcs: { pc: number; state: State }[]) {
    return {
        JUMPI: (opcode: Opcode, state: State) => {
            const offset = state.stack.pop();
            const condition = state.stack.pop();

            let pc: number | null = null;
            if (typeof offset === 'bigint') {
                const dest = opcodes.find(o => o.offset === Number(offset))!;
                if (dest) {
                    pc = dest.pc;
                    // const jumpIndex = opcodes.indexOf(dest);
                    pcs.push({ pc: opcode.pc + 1, state: state.clone() });
                    pcs.push({ pc: dest.pc, state: state.clone() });
                }
            }

            state.stmts.push(new Jumpi(condition, offset, pc));
            state.halted = true;
        },

        JUMP: (_opcode: Opcode, state: State) => {
            const offset = state.stack.pop();

            let pc: number | null = null;
            if (typeof offset === 'bigint') {
                const dest = opcodes.find(o => o.offset === Number(offset))!;
                if (dest) {
                    pc = dest.pc;
                    // const jumpIndex = opcodes.indexOf(dest);
                    // state.pc = jumpIndex;
                    pcs.push({ pc: dest.pc, state: state.clone() });
                }
            }

            state.stmts.push(new Jump(offset, pc));
            state.halted = true;
        },
    };
}

export function pprint(blocks: ControlFlowGraph) {
    for (const [pc, block] of Object.entries(blocks)) {
        console.log(pc, ':');
        block.opcodes.forEach(op => console.log('  ', formatOpcode(op)));
        console.log('  =| ', block.stack.values.join(' | '));
        block.stmts.forEach(stmt => console.log('  ', stmt.toString()));
    }
}
