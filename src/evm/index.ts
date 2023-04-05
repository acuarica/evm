import { decode, OPCODES, type Opcode, MNEMONICS } from '../opcode';
import { type Stack, State as TState } from '../state';
import { type Metadata, stripMetadataHash } from '../metadata';

import { type Expr, type IInst, type Inst, Throw, Val } from './expr';

import { PUSHES, STACK } from './stack';
import { MATH } from './math';
import { LOGIC } from './logic';
import { SPECIAL } from './special';
import { MEMORY } from './memory';
import { Invalid, SYSTEM } from './system';
import { LOGS, type IEvents } from './log';
import { type IStore, STORAGE } from './storage';
import { Branch, FLOW, type ISelectorBranches, JumpDest, makeBranch } from './flow';
import { mapValues } from '../object';

type State = TState<Inst, Expr>;

function mapStack<K extends string>(table: { [mnemonic in K]: (stack: Stack<Expr>) => void }) {
    return mapValues(table, fn => (_: Opcode, state: State) => fn(state.stack));
}

function mapState<K extends string>(table: { [mnemonic in K]: (state: State) => void }) {
    return mapValues(table, fn => (_: Opcode, state: State) => fn(state));
}

export const INSTS = {
    ...mapStack(MATH),
    ...mapStack(LOGIC),
    ...mapState(SPECIAL),
    ...mapState(MEMORY),
    JUMPDEST: (_: Opcode, _state: State) => {},
    ...mapValues(PUSHES, fn => (op: Opcode, state: State) => fn(op.pushData!, state.stack)),
    ...mapStack(STACK<Expr>()),
    ...mapState(SYSTEM),
    PC: (op: Opcode, { stack }: TState<Inst, Expr>) => stack.push(new Val(BigInt(op.offset))),
    INVALID: (op: Opcode, state: TState<Inst, Expr>): void => state.halt(new Invalid(op.opcode)),
};

/**
 * Maps `mnemonic` keys of `insts` to their corresponding `opcode` in the byte range, _i.e._, `0-255`.
 * For elements in the range `0-255` that do not have a corresponding `mnemonic`,
 * `INVALID` is used instead.
 *
 * @param insts
 * @returns
 */
function fill<F>(insts: { [mnemonic in keyof typeof OPCODES]: F }) {
    return Object.fromEntries(
        [...Array(256).keys()].map(k => [
            k,
            MNEMONICS[k] === undefined ? INSTS.INVALID : insts[MNEMONICS[k]],
        ])
    );
}

/**
 * https://ethereum.github.io/execution-specs/autoapi/ethereum/index.html
 */
export class EVM implements IEvents, IStore, ISelectorBranches {
    /**
     * The `metadataHash` part from the `bytecode`.
     * That is, if present, the `bytecode` without its `code`.
     */
    readonly metadata?: Metadata | undefined;

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
    readonly errors: Throw[] = [];

    readonly events: IEvents['events'] = {};
    readonly variables: IStore['variables'] = {};
    readonly mappings: IStore['mappings'] = {};
    readonly functionBranches: ISelectorBranches['functionBranches'] = new Map<
        string,
        { pc: number; state: State }
    >();

    /**
     * The `Opcode[]` decoded from `bytecode`.
     */
    readonly opcodes: ReturnType<typeof decode>['opcodes'];

    /**
     * Jump destination (`JUMPDEST`) offsets found in `bytecode`.
     * This is used to speed up offset search.
     */
    readonly jumpdests: ReturnType<typeof decode>['jumpdests'];

    constructor(bytecode: string) {
        /**
         * The `code` part from the `bytecode`.
         * That is, the `bytecode` without its metadata hash, if any.
         */
        const [code, metadata] = stripMetadataHash(bytecode);
        this.metadata = metadata;

        const { opcodes, jumpdests } = decode(Buffer.from(code.replace('0x', ''), 'hex'));

        this.opcodes = opcodes;
        this.jumpdests = jumpdests;

        this.insts = fill({
            ...INSTS,
            ...FLOW({ opcodes, jumpdests }, this),
            ...mapState(STORAGE(this)),
            ...mapState(LOGS(this)),
        });
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
        if (state.halted) throw new Error(`State at ${pc0} must be non-halted to be \`exec\``);

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
                const inv = new Throw(message, opcode, state);
                // `\`${message}\` at [${opcode.offset}] ${opcode.mnemonic} =| ${state.stack.values
                // .slice(0, -1)
                // .join(' | ')}`
                state.halt(inv);
                this.errors.push(inv);
            }
        }

        if (!state.halted) throw new Error(`State must be halted after exec at ${pc0}:${pc}`);

        let chunk = this.chunks.get(pc0);
        if (chunk === undefined) {
            chunk = {
                pcend: pc,
                states: [state],
            };
            this.chunks.set(pc0, chunk);
        } else {
            chunk.states.push(state);
        }
    }
}

export function gc(b: Branch, chunks: EVM['chunks']) {
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
