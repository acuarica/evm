import { decode, OPCODES, type Opcode, MNEMONICS } from '../opcode';
import { type Stack, State as TState } from '../state';
import { type Metadata, stripMetadataHash } from '../metadata';

import type { Expr, IInst, Inst } from './expr';

import { PUSHES, STACK } from './stack';
import { MATH } from './math';
import { LOGIC } from './logic';
import { ENV } from './env';
import { SYM as SYMBOLS } from './sym';
import { MEMORY } from './memory';
import { Invalid, INVALID, PC, SYSTEM } from './system';
import { LOGS, type IEvents } from './log';
import { type IStore, STORAGE } from './storage';
import { Branch, FLOW, type ISelectorBranches, JumpDest, makeBranch } from './flow';

import { assert } from '../error';

type State = TState<Inst, Expr>;

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

/**
 * Swaps `insts` keying by `opcode` and fills the gaps using `INVALID` inst.
 *
 * @param insts
 * @returns
 */
function fill<F>(insts: { [mnemonic in keyof typeof OPCODES]: F }) {
    return Object.fromEntries(
        [...Array(256).keys()].map(k => [
            k,
            MNEMONICS[k] === undefined ? INVALID : insts[MNEMONICS[k]],
        ])
    );
}

export class EVM implements IEvents, IStore, ISelectorBranches {
    /**
     *
     */
    private readonly insts: {
        [opcode in string]: (opcode: Opcode, state: TState<Inst, Expr>) => void;
    };

    /**
     *
     */
    readonly chunks = new Map<number, { pcend: number; states: State[] }>();

    /**
     *
     */
    readonly errors: Invalid[] = [];

    readonly events: IEvents['events'] = {};
    readonly variables: IStore['variables'] = {};
    readonly mappings: IStore['mappings'] = {};
    readonly functionBranches: ISelectorBranches['functionBranches'] = new Map<
        string,
        { pc: number; state: State }
    >();

    readonly opcodes: ReturnType<typeof decode>['opcodes'];

    readonly jumpdests: ReturnType<typeof decode>['jumpdests'];

    constructor({ opcodes, jumpdests }: ReturnType<typeof decode>, readonly metadata?: Metadata) {
        this.opcodes = opcodes;
        this.jumpdests = jumpdests;

        this.insts = fill({
            ...TABLE,
            ...FLOW({ opcodes, jumpdests }, this),
            ...makeState(STORAGE(this)),
            ...makeState(LOGS(this)),
        });
    }

    /**
     *
     * @param bytecode
     * @returns
     */
    static from(bytecode: string): EVM {
        const [code, metadata] = stripMetadataHash(bytecode);
        return new EVM(decode(Buffer.from(code.replace('0x', ''), 'hex')), metadata);
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
            if (chunk !== undefined && chunk.states.length > 10) {
                continue;
            }

            this.exec(branch.pc, branch.state);
            const last = branch.state.last! as IInst;
            if (last.next) {
                for (const b of last.next()) {
                    // const s = gc(b, this.chunks);
                    // if (s === undefined) {
                    branches.unshift(b);
                    // } else {
                    //     b.state = s;
                    // }
                }
                // branches.unshift(...last.next());
            }
        }
    }

    exec(pc0: number, state: State) {
        assert(!state.halted);
        let pc = pc0;
        const oplen = this.opcodes.length;
        for (; !state.halted && pc < oplen; pc++) {
            const opcode = this.opcodes[pc];
            try {
                this.insts[opcode.opcode](opcode, state);
                if (
                    !state.halted &&
                    pc < oplen + 1 &&
                    this.opcodes[pc + 1].opcode === OPCODES.JUMPDEST
                ) {
                    const fallBranch = makeBranch(opcode.pc + 1, state);
                    state.halt(new JumpDest(fallBranch));
                }
            } catch (err) {
                const message = (err as Error).message;
                const inv = new Invalid(
                    `\`${message}\` at [${opcode.offset}] ${opcode.mnemonic} =| ${state.stack.values
                        .slice(0, -1)
                        .join(' | ')}`
                );
                state.halt(inv);
                this.errors.push(inv);
            }
        }

        assert(state.halted, pc0, pc);

        let chunk = this.chunks.get(pc0);
        if (chunk === undefined) {
            chunk = {
                pcend: pc,
                states: [state],
            };
            this.chunks.set(pc0, chunk);
        } else {
            assert(chunk.pcend === pc, chunk.pcend, pc, state.last);
            chunk.states.push(state);
        }
    }
}

function gc(b: Branch, chunks: EVM['chunks']) {
    const chunk = chunks.get(b.pc);
    if (chunk !== undefined) {
        for (const s of chunk.states) {
            if (cmp(b.state, s)) {
                return s;
            }
        }
    }
    return undefined;
}

function cmp({ stack: lhs }: TState<Inst, Expr>, { stack: rhs }: TState<Inst, Expr>) {
    if (lhs.values.length !== rhs.values.length) {
        return false;
    }
    for (let i = 0; i < lhs.values.length; i++) {
        if (!cmpval(lhs.values[i], rhs.values[i])) {
            return false;
        }
    }
    return true;

    function cmpval(lhs: Expr, rhs: Expr) {
        return !(lhs.isVal() && lhs.isPush) || !(rhs.isVal() && rhs.isPush) || lhs.val === rhs.val;
    }
}
