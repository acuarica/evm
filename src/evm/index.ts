import { decode, OPCODES, type Opcode, MNEMONICS } from '../opcode';
import { State } from '../state';
import { type Metadata, stripMetadataHash } from '../metadata';
import { type Expr, type IInst, type Inst, Throw } from './expr';
import { type IEvents } from './log';
import { type IStore } from './storage';
import { Branch, type ISelectorBranches, JumpDest, makeBranch } from './flow';
import { STEP, type Step } from '../step';

export * from './expr';
export * from './system';

/**
 * An alias `type` for the `State` used in the `EVM`.
 */
export type EVMState = State<Inst, Expr>;

export { Branch };
export * from '../state';

export type { Metadata } from '../metadata';

/**
 * Maps `mnemonic` keys of `insts` to their corresponding `opcode` in the byte range, _i.e._, `0-255`.
 * For elements in the range `0-255` that do not have a corresponding `mnemonic`,
 * `INVALID` is used instead.
 *
 * @param insts
 * @returns
 */
function fill(insts: { [mnemonic in keyof typeof OPCODES]: Step['INVALID'] }): {
    [opcode: number]: (state: EVMState, opcode: Opcode) => void;
} {
    const entry = (k: number) => (MNEMONICS[k] === undefined ? insts.INVALID : insts[MNEMONICS[k]]);
    return Object.fromEntries([...Array(256).keys()].map(k => [k, entry(k)]));
}

/**
 * https://ethereum.github.io/execution-specs/autoapi/ethereum/index.html
 */
export class EVM {
    /**
     * The `metadataHash` part from the `bytecode`.
     * That is, if present, the `bytecode` without its `code`.
     */
    readonly metadata?: Metadata | undefined;

    /**
     *
     */
    readonly insts: {
        [opcode: number]: (state: EVMState, opcode: Opcode) => void;
    };

    /**
     *
     */
    readonly chunks = new Map<number, { pcend: number; states: EVMState[] }>();

    /**
     *
     */
    readonly errors: Throw[] = [];

    readonly events: IEvents['events'];
    readonly variables: IStore['variables'];
    readonly mappings: IStore['mappings'];
    readonly functionBranches: ISelectorBranches['functionBranches'];

    /**
     * The `Opcode[]` decoded from `bytecode`.
     */
    readonly opcodes: ReturnType<typeof decode>['opcodes'];

    /**
     * Jump destination (`JUMPDEST`) offsets found in `bytecode`.
     * This is used to speed up offset search.
     */
    readonly jumpdests: ReturnType<typeof decode>['jumpdests'];

    // readonly step:
    constructor(bytecode: string, insts: Partial<Step> = {}) {
        /**
         * The `code` part from the `bytecode`.
         * That is, the `bytecode` without its metadata hash, if any.
         */
        const [code, metadata] = stripMetadataHash(bytecode);
        this.metadata = metadata;

        const { opcodes, jumpdests } = decode(code);

        this.opcodes = opcodes;
        this.jumpdests = jumpdests;

        // this.insts = fill({
        //     ...insts,
        //     ...FLOW({ opcodes, jumpdests }, this),
        //     ...STORAGE(this),
        //     ...LOGS(this),
        // });
        const s = STEP({ opcodes, jumpdests });
        this.events = s.events;
        this.mappings = s.mappings;
        this.variables = s.variables;
        this.functionBranches = s.functionBranches;
        this.insts = fill({ ...s, ...insts });
    }

    // get eventsi(): IEvents['events'] {

    // }
    // readonly variables: IStore['variables'] = {};
    // readonly mappings: IStore['mappings'] = {};
    // readonly functionBranches: ISelectorBranches['functionBranches'] = new Map<
    // string,
    // { pc: number; state: EVMState }
    // >();

    /**
     *
     */
    start() {
        this.run(0, new State());
        for (const [, branch] of this.functionBranches) {
            this.run(branch.pc, branch.state);
        }
    }

    run(pc0: number, state: EVMState) {
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

    exec(pc0: number, state: EVMState) {
        if (state.halted) throw new Error(`State at ${pc0} must be non-halted to be \`exec\``);

        let pc = pc0;
        const oplen = this.opcodes.length;
        for (; !state.halted && pc < oplen; pc++) {
            const opcode = this.opcodes[pc];
            try {
                this.insts[opcode.opcode](state, opcode);
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

function cmp({ stack: lhs }: EVMState, { stack: rhs }: EVMState) {
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
