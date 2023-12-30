import { type Ram, State, type Stack, ExecError } from './state';
import { type Metadata, stripMetadataHash } from './metadata';
import { type Expr, type IInst, type Inst, Throw } from './ast';
import { Branch, JumpDest } from './ast/flow';
import { Opcode, fromHexString, Shanghai, JUMPDEST, type StepFn, type Undef } from './step';

/**
 * https://ethereum.github.io/execution-specs/autoapi/ethereum/index.html
 */
export class EVM<M extends string> {

    /**
     * The `metadataHash` part from the `bytecode`.
     * That is, if present, the `bytecode` without its `code`.
     */
    readonly metadata: Metadata | undefined;

    /**
     *
     */
    readonly blocks = new Map<number, { pcend: number; opcodes: { opcode: Opcode<M>, stack: Stack<Expr> }[]; states: State<Inst, Expr>[]; }>();

    /**
     *
     */
    readonly errors: Throw[] = [];

    /**
     * The `Opcode[]` decoded from `bytecode`.
     */
    readonly opcodes: Opcode<M>[];

    /**
     * Jump destination (`JUMPDEST`) offsets found in `bytecode`.
     * This is used to speed up offset search.
     */
    readonly bytecode: Uint8Array;

    constructor(
        bytecode: string,

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
        readonly step: Undef<M> & { readonly [m in M]: StepFn }
    ) {
        this.bytecode = fromHexString(bytecode);

        const [code, metadata] = stripMetadataHash(bytecode);
        this.metadata = metadata;

        this.opcodes = this.step.decode(code);
    }

    /**
     * Creates a new `EVM` with the latest fork, _i.e._, `Shanghai`.
     */
    static new(bytecode: string) {
        return new EVM(bytecode, new Shanghai());
    }

    /**
     *
     */
    chunks(): {
        pcstart: number;
        pcend: number;
        states?: State<Inst, Expr>[]
    }[] {
        let lastPc = 0;

        const result: ReturnType<typeof EVM.prototype.chunks> = [];
        const pcs = [...this.blocks.keys()];
        pcs.sort((a, b) => a - b);
        for (const pc of pcs) {
            const block = this.blocks.get(pc)!;
            if (lastPc !== pc) {
                result.push({ pcstart: lastPc, pcend: pc });
            }
            lastPc = block.pcend;
            result.push({ pcstart: pc, pcend: block.pcend, states: block.states });
        }

        if (lastPc !== this.bytecode.length) {
            result.push({ pcstart: lastPc, pcend: this.bytecode.length });
        }

        return result;
    }

    /**
     *
     */
    start(): State<Inst, Expr> {
        const state = new State<Inst, Expr>();
        this.run(0, state);
        for (const [, branch] of this.step.functionBranches) {
            this.run(branch.pc, branch.state);
        }
        return state;
    }

    run(pc0: number, state: State<Inst, Expr>): void {
        const branches: Branch[] = [new Branch(pc0, state)];
        while (branches.length > 0) {
            const branch = branches.shift()!;

            const chunk = this.blocks.get(branch.pc);
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

    // sourceMap = new Map<Expr, Opcode>();

    exec(pc0: number, state: State<Inst, Expr>): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        // const self = this;
        if (state.halted) throw new Error(`State at ${pc0} must be non-halted to be \`exec\``);

        // let opcode: Opcode;
        // const t = new Proxy(state.stack, {
        //     get(target, prop, receiver) {
        //         if (prop === 'push') {
        //             const pushMethod = target[prop];
        //             return function (...args: [elem: Expr]) {
        //                 const expr = args[0];
        //                 self.sourceMap.set(expr, opcode);
        //                 pushMethod.apply(target, args);
        //             };
        //         }
        //         // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        //         return Reflect.get(target, prop, receiver);
        //     },
        // });
        // state = new Proxy(state, {
        //     get(target, prop, receiver) {
        //         if (prop === 'stack') {
        //             return t;
        //         }
        //         // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        //         return Reflect.get(target, prop, receiver);
        //     },
        // });

        const opcodes = [];
        let pc = pc0;
        // for (; !state.halted && pc < this.opcodes.length; pc++) {
        for (; !state.halted && pc < this.bytecode.length; pc++) {
            const op = this.bytecode[pc];
            const [size, , mnemonic] = this.step[op];
            const opcode = new Opcode(pc, op, mnemonic,
                size === 0 ? null : (() => {
                    const data = this.bytecode.subarray(pc + 1, pc + size + 1);
                    if (data.length !== size) throw new Error('asdfsadf');
                    pc += size;
                    return data;
                })()
            );

            try {
                this.step[mnemonic](state, opcode, this.bytecode);
                opcodes.push({ opcode, stack: state.stack.clone() });
            } catch (err) {
                if (err instanceof ExecError) {
                    const inv = new Throw(err.message, opcode, state);
                    state.halt(inv);
                    this.errors.push(inv);
                    continue;
                }

                throw err;
            }

            if (!state.halted && this.bytecode[pc + 1] === JUMPDEST) {
                const fallBranch = Branch.make(pc + 1, state);
                state.halt(new JumpDest(fallBranch));
            }
        }

        if (!state.halted) throw new Error(`State must be halted after \`exec\` at ${pc0}:${pc}`);

        const block = this.blocks.get(pc0);
        if (block === undefined) {
            this.blocks.set(pc0, { pcend: pc, opcodes, states: [state] });
        } else {
            block.states.push(state);
        }
    }

    /**
     * Migrated from old codebase.
     * Evaluate if it makes sense to keep it.
     *
     * @param opcode The opcode to look for.
     * @returns Whether the contract contains the given `opcode`.
     */
    containsOpcode(opcode: number | M): boolean {
        const opcodes = this.step.opcodes();

        let halted = false;
        if (typeof opcode === 'string' && opcode in opcodes) {
            opcode = opcodes[opcode];
        } else if (typeof opcode === 'string') {
            throw new Error(`Provided opcode \`${opcode}\` is not a valid opcode mnemonic'`);
        }
        for (let index = 0; index < this.opcodes.length; index++) {
            const currentOpcode = this.opcodes[index].opcode;
            if (currentOpcode === opcode && !halted) {
                return true;
            } else if (currentOpcode === JUMPDEST) {
                halted = false;
            } else if (this.step[currentOpcode][1]) {
                halted = true;
            }
        }
        return false;
    }

    gc(b: Branch) {
        const chunk = this.blocks.get(b.pc);

        if (chunk !== undefined) {
            for (const s of chunk.states) {
                if (cmp(b.state, s)) {
                    return s;
                }
            }
        }
        return undefined;
    }
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
