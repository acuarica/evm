import { decode, formatOpcode, type OPCODES, type Opcode } from '../opcode';
import { type Stack, State as TState } from '../state';
import { type Metadata, stripMetadataHash } from '../metadata';

import type { Expr, IStmt, Stmt } from './ast';

import { PUSHES, STACK } from './stack';
import { MATH } from './math';
import { LOGIC } from './logic';
import { ENV } from './env';
import { SYM as SYMBOLS } from './sym';
import { MEMORY } from './memory';
import { INVALID, PC, SYSTEM } from './system';
import { LOGS, type IEvents } from './log';
import { type IStore, STORAGE } from './storage';
import { Branch, FLOW, type ISelectorBranches, JumpDest, makeBranch } from './flow';

import { assert } from '../error';

type State = TState<Stmt, Expr>;

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
    ...makeStack(ENV),
    ...makeState(SYMBOLS),
    ...makeState(MEMORY),
    JUMPDEST: (_opcode: Opcode, _state: State) => {},
    ...make(
        PUSHES,
        (fn: (pushData: Uint8Array, stack: Stack<Expr>) => void) => (opcode, state) =>
            fn(opcode.pushData!, state.stack)
    ),
    ...makeStack(STACK<Expr>()),
    ...makeState(SYSTEM),
    PC,
    INVALID,
};

export class EVM implements IStore, ISelectorBranches {
    /**
     *
     */
    private readonly insts: {
        [mnemonic in keyof typeof OPCODES]: (opcode: Opcode, state: TState<Stmt, Expr>) => void;
    };

    /**
     *
     */
    readonly chunks = new Map<number, { pcend: number; states: State[] }>();

    /**
     *
     */
    readonly functionBranches = new Map<string, { pc: number; state: State }>();

    readonly variables: IStore['variables'] = {};

    readonly mappings: IStore['mappings'] = {};

    constructor(
        readonly opcodes: Opcode[],
        readonly events: IEvents,
        readonly metadata?: Metadata
    ) {
        this.insts = {
            ...TABLE,
            ...FLOW(opcodes, this),
            ...makeState(STORAGE(this)),
            ...makeState(LOGS(events)),
        };
    }

    /**
     *
     * @param bytecode
     * @param events
     * @returns
     */
    static from(bytecode: string, events: IEvents): EVM {
        const [code, metadata] = stripMetadataHash(bytecode);
        return new EVM(decode(Buffer.from(code, 'hex')), events, metadata);
    }

    /**
     *
     */
    start() {
        this.run(0, new TState());
        for (const [, branch] of this.functionBranches) {
            this.run(branch.pc, branch.state);
        }
    }

    run(pc0: number, state: State) {
        const branches: Branch[] = [new Branch(pc0, state)];
        while (branches.length > 0) {
            // The non-null assertion operator `!` is required because the guard does not track array's emptiness.
            // See https://github.com/microsoft/TypeScript/issues/30406.
            const branch = branches.shift()!;

            const chunk = this.chunks.get(branch.pc);
            if (chunk !== undefined && chunk.states.length > 4) {
                continue;
            }

            this.exec(branch.pc, branch.state);
            const last = branch.state.last! as IStmt;
            if (last.next) {
                branches.unshift(...last.next());
            }
        }
    }

    exec(pc0: number, state: State) {
        let pc = pc0;
        for (; !state.halted && pc < this.opcodes.length; pc++) {
            const opcode = this.opcodes[pc];
            try {
                this.insts[opcode.mnemonic](opcode, state);
            } catch (err) {
                const message = (err as Error).message;
                throw new Error(
                    `\`${message}\` at [${opcode.offset}] ${
                        opcode.mnemonic
                    } =| ${state.stack.values.join(' | ')}`
                );
            }

            if (
                !state.halted &&
                pc < this.opcodes.length + 1 &&
                this.opcodes[pc + 1].mnemonic === 'JUMPDEST'
            ) {
                const fallBranch = makeBranch(opcode.pc + 1, state);
                state.halt(new JumpDest(fallBranch));
            }
        }

        assert(state.halted);

        let chunk = this.chunks.get(pc0);
        if (chunk === undefined) {
            chunk = {
                pcend: pc,
                states: [state],
            };
            this.chunks.set(pc0, chunk);
        } else {
            assert(chunk.pcend === pc);
            chunk.states.push(state);
        }
    }

    /**
     *
     * @param offset
     * @returns
     */
    getDest(offset: Expr): Opcode {
        const offset2 = offset.eval();
        if (!offset2.isVal()) {
            throw new Error('Expected numeric offset, found' + offset.toString());
        }
        const dest = this.opcodes.find(o => o.offset === Number(offset2.val));
        if (!dest) {
            throw new Error('Expected `JUMPDEST` in JUMP destination, but none was found');
        }
        if (dest.mnemonic !== 'JUMPDEST') {
            throw new Error('JUMP destination should be JUMPDEST but found' + formatOpcode(dest));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (offset as any).jumpDest = dest.pc;
        return dest;
    }
}
