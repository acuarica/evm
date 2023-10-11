import { decode, OPCODES, type Opcode, MNEMONICS } from './opcode';
import { State } from './state';
import { type Metadata, stripMetadataHash } from './metadata';
import { STEP, type Step, type ISelectorBranches } from './step';

import { type Expr, type IInst, type Inst, Throw } from './ast/expr';
import { type IEvents } from './ast/log';
import { type IStore } from './ast/storage';
import { Branch, JumpDest } from './ast/flow';

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
     * The `STEP` function that updates the `State`
     * after executing the opcode pointed by `pc`.
     *
     * Maps `mnemonic` keys of `STEP` to their corresponding `opcode`
     * in the byte range, _i.e._, `0-255`.
     *
     * For elements in the range `0-255` that do not have a corresponding `mnemonic`,
     * `INVALID` is used instead.
     */
    readonly insts: {
        [opcode: number]: (state: State<Inst, Expr>, opcode: Opcode) => void;
    };

    /**
     *
     */
    readonly chunks = new Map<number, { pcend: number; states: State<Inst, Expr>[] }>();

    /**
     *
     */
    readonly errors: Throw[] = [];

    readonly events: IEvents;
    readonly variables: IStore['variables'];
    readonly mappings: IStore['mappings'];
    readonly functionBranches: ISelectorBranches;

    /**
     * The `Opcode[]` decoded from `bytecode`.
     */
    readonly opcodes: ReturnType<typeof decode>['opcodes'];

    /**
     * Jump destination (`JUMPDEST`) offsets found in `bytecode`.
     * This is used to speed up offset search.
     */
    readonly jumpdests: ReturnType<typeof decode>['jumpdests'];

    constructor(bytecode: string, insts: Partial<Step> = {}) {
        const [code, metadata] = stripMetadataHash(bytecode);
        this.metadata = metadata;

        const { opcodes, jumpdests } = decode(code);

        this.opcodes = opcodes;
        this.jumpdests = jumpdests;

        const s = STEP({ opcodes, jumpdests });
        this.events = s.events;
        this.mappings = s.mappings;
        this.variables = s.variables;
        this.functionBranches = s.functionBranches;

        this.insts = fill({ ...s, ...insts });

        function fill(insts: { [mnemonic in keyof typeof OPCODES]: Step['INVALID'] }): {
            [opcode: number]: (state: State<Inst, Expr>, opcode: Opcode) => void;
        } {
            const entry = (k: number) => insts[MNEMONICS[k] ?? 'INVALID'];
            return Object.fromEntries([...Array(256).keys()].map(k => [k, entry(k)]));
        }
    }

    /**
     *
     */
    start() {
        this.run(0, new State());
        for (const [, branch] of this.functionBranches) {
            this.run(branch.pc, branch.state);
        }
    }

    run(pc0: number, state: State<Inst, Expr>) {
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

    exec(pc0: number, state: State<Inst, Expr>) {
        if (state.halted) throw new Error(`State at ${pc0} must be non-halted to be \`exec\``);

        let pc = pc0;
        for (; !state.halted && pc < this.opcodes.length; pc++) {
            const opcode = this.opcodes[pc];
            try {
                this.insts[opcode.opcode](state, opcode);
                if (!state.halted && this.opcodes[pc + 1]?.opcode === OPCODES.JUMPDEST) {
                    const fallBranch = Branch.make(opcode.pc + 1, state);
                    state.halt(new JumpDest(fallBranch));
                }
            } catch (err) {
                const inv = new Throw((err as Error).message, opcode, state);
                state.halt(inv);
                this.errors.push(inv);
            }
        }

        if (!state.halted) throw new Error(`State must be halted after \`exec\` at ${pc0}:${pc}`);

        const chunk = this.chunks.get(pc0);
        if (chunk === undefined) {
            this.chunks.set(pc0, { pcend: pc, states: [state] });
        } else {
            chunk.states.push(state);
        }
    }

    /**
     * Migrated from old codebase.
     * Evaluate if it makes sense to keep it.
     *
     * @param opcode The opcode to look for.
     * @returns Whether the contract contains the given `opcode`.
     */
    containsOpcode(opcode: number | keyof typeof OPCODES): boolean {
        const HALTS: (keyof typeof OPCODES)[] = [
            'STOP',
            'RETURN',
            'REVERT',
            'INVALID',
            'SELFDESTRUCT',
        ];
        let halted = false;
        if (typeof opcode === 'string' && opcode in OPCODES) {
            opcode = OPCODES[opcode];
        } else if (typeof opcode === 'string') {
            throw new Error(`Provided opcode '${opcode}' is not a valid opcode mnemonic'`);
        }
        for (let index = 0; index < this.opcodes.length; index++) {
            const currentOpcode = this.opcodes[index].opcode;
            if (currentOpcode === opcode && !halted) {
                return true;
            } else if (currentOpcode === OPCODES.JUMPDEST) {
                halted = false;
            } else if (HALTS.includes(MNEMONICS[currentOpcode] ?? 'INVALID')) {
                halted = true;
            }
        }
        return false;
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

function cmp({ stack: lhs }: State<Inst, Expr>, { stack: rhs }: State<Inst, Expr>) {
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
