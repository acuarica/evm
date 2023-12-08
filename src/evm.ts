import { decode, OPCODES, type Opcode, MNEMONICS } from './opcode';
import { type Ram, State } from './state';
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
    start(): State<Inst, Expr> {
        const state = new State<Inst, Expr>();
        this.run(0, state);
        for (const [, branch] of this.functionBranches) {
            this.run(branch.pc, branch.state);
        }
        return state;
    }

    run(pc0: number, state: State<Inst, Expr>): void {
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
            for (const next of last.next ? last.next() : []) {
                // const s = gc(b, this.chunks);
                // if (s === undefined) {
                branches.unshift(next);

                // const chunk = this.chunks.get(next.pc);
                // if (chunk === undefined) {
                //     this.chunks.set(next.pc, { pcend: -1, states: [branch.state] });
                // } else {
                //     chunk.states.push(branch.state);
                // }

                // } else {
                // next.state = s;
                // }
            }
            // branches.unshift(...last.next());
        }
    }

    sourceMap = new Map<Expr, Opcode>();

    exec(pc0: number, state: State<Inst, Expr>): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        if (state.halted) throw new Error(`State at ${pc0} must be non-halted to be \`exec\``);

        let opcode: Opcode;
        const t = new Proxy(state.stack, {
            get(target, prop, receiver) {
                if (prop === 'push') {
                    const pushMethod = target[prop];
                    return function (...args: [elem: Expr]) {
                        const expr = args[0];
                        self.sourceMap.set(expr, opcode);
                        pushMethod.apply(target, args);
                    };
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return Reflect.get(target, prop, receiver);
            },
        });
        state = new Proxy(state, {
            get(target, prop, receiver) {
                if (prop === 'stack') {
                    return t;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return Reflect.get(target, prop, receiver);
            },
        });
        let pc = pc0;
        for (; !state.halted && pc < this.opcodes.length; pc++) {
            opcode = this.opcodes[pc];
            const step = this.insts[opcode.opcode];

            try {
                step(state, opcode);
            } catch (err) {
                const inv = new Throw((err as Error).message, opcode, state);
                state.halt(inv);
                this.errors.push(inv);
                continue;
            }

            if (!state.halted && this.opcodes[pc + 1]?.opcode === OPCODES.JUMPDEST) {
                const fallBranch = Branch.make(opcode.pc + 1, state);
                state.halt(new JumpDest(fallBranch));
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

function cmp({ stack: lhs }: Ram<Expr>, { stack: rhs }: Ram<Expr>) {
    const cmpval = (lhs: Expr, rhs: Expr) =>
        !(lhs.isVal() && lhs.isPush) || !(rhs.isVal() && rhs.isPush) || lhs.val === rhs.val;

    // console.log('????', lhs.values, rhs.values);
    if (lhs.values.length !== rhs.values.length) {
        // console.log('asdadsdsadsads', lhs.values, rhs.values);
        return false;
    }
    for (let i = 0; i < lhs.values.length; i++) {
        if (!cmpval(lhs.values[i], rhs.values[i])) {
            // console.log('212112');
            return false;
        }
    }
    return true;
}
