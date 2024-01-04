import { Throw, type Expr, type IInst, type Inst } from './ast';
import { Branch, JumpDest } from './ast/flow';
import { arrayify } from './bytes';
import { ExecError, State, type Ram, type Stack } from './state';
import { JUMPDEST, Shanghai, type Opcode, type StepFn, type Undef } from './step';

/**
 * Represent a reacheable basic block.
 */
export interface Block<M> {

    /**
     * Where this block ends, exclusive.
     */
    readonly pcend: number;
    /**
     * The `Opcode`s decoded from `bytecode` augmented with its `Stack` trace.
     */
    readonly opcodes: {
        readonly opcode: Opcode<M>,
        stack?: Stack<Expr>
    }[];
    readonly states: State<Inst, Expr>[];
}

/**
 * https://ethereum.github.io/execution-specs/autoapi/ethereum/index.html
 */
export class EVM<M extends string> {

    /**
     * Reacheable `blocks` found in `this.bytecode`.
     */
    readonly blocks = new Map<number, Block<M>>();

    /**
     * Symbolic execution `errors` found during interpretation of `this.bytecode`.
     */
    readonly errors: Throw[] = [];

    /**
     * The bytecode buffer that represents a Contract or Library.
     */
    readonly bytecode: Uint8Array;

    constructor(
        bytecode: Parameters<typeof arrayify>[0],

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
        this.bytecode = arrayify(bytecode);
    }

    /**
     * Creates a new `EVM` with the latest defined execution fork.
     */
    static new(bytecode: Parameters<typeof arrayify>[0]) {
        return new EVM(bytecode, new Shanghai());
    }

    /**
     * 
     */
    chunks(): {
        /**
         * Where this `chunk` begins, inclusive.
         */
        pcbegin: number;
        /**
         * Where this `chunk` ends, exclusive.
         */
        pcend: number;

        /**
         * The content found for this `chunk`.
         * If `pcbegin` is reacheable, then `content` is the `Opcode` for this block. 
         * Otherwise the uninterpreted slice of the bytecode for this chunk.
         */
        content: Opcode<M>[] | Uint8Array,

        states?: State<Inst, Expr>[]
    }[] {
        let lastPc = 0;

        const result: ReturnType<typeof EVM.prototype.chunks> = [];
        const pcs = [...this.blocks.keys()];
        pcs.sort((a, b) => a - b);
        for (const pc of pcs) {
            const block = this.blocks.get(pc)!;
            if (lastPc !== pc) {
                result.push({ pcbegin: lastPc, pcend: pc, content: this.bytecode.subarray(lastPc, pc) });
            }
            lastPc = block.pcend;
            const opcodes = block.opcodes.map(({ opcode, }) => opcode);
            result.push({ pcbegin: pc, pcend: block.pcend, content: opcodes, states: block.states });
        }

        if (lastPc !== this.bytecode.length) {
            result.push({ pcbegin: lastPc, pcend: this.bytecode.length, content: this.bytecode.subarray(lastPc) });
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
        // let pc = pc0;
        // for (; pc < this.bytecode.length; pc++) {
        let opcode;
        for (opcode of this.step.decode(this.bytecode, pc0)) {
            // const op = this.bytecode[pc];
            // const [size, halts, mnemonic] = this.step[op];
            // const opcode = new Opcode(pc, op, mnemonic,
            //     size === 0 ? null : (() => {
            //         const data = this.bytecode.subarray(pc + 1, pc + size + 1);
            //         if (data.length !== size) throw new Error('asdfsadf');
            //         pc += size;
            //         return data;
            //     })()
            // );

            const [, halts, mnemonic] = this.step[opcode.opcode];

            const entry: Block<M>['opcodes'][number] = { opcode };
            opcodes.push(entry);

            try {
                if (!state.halted) {
                    this.step[mnemonic](state, opcode, this.bytecode);
                    entry.stack = state.stack.clone();
                }
            } catch (err) {
                if (!(err instanceof ExecError)) throw err;

                const invalid = new Throw(err.message, opcode, state);
                state.halt(invalid);
                this.errors.push(invalid);
            }

            // if (!state.halted && this.bytecode[pc + 1] === JUMPDEST) {
            // const nextpc = opcode.pc + opcode.size + 1;
            if (!halts && this.bytecode[opcode.nextpc] === JUMPDEST) {
                const fallBranch = Branch.make(opcode.nextpc, state);
                state.halt(new JumpDest(fallBranch));
                // halts = true;
                /* two consecutive jumpdest blocks */
                break;
            }

            if (halts) {
                if (!state.halted) throw Error('asfdasdf 12123');
                break;
            }
        }

        if (opcode === undefined) throw new Error(`Executing block at ${pc0} cannot be empty`);

        if (!state.halted) throw new Error(`State must be halted after executing block at ${pc0}..${opcode.pc}`);

        const block = this.blocks.get(pc0);
        if (block === undefined) {
            this.blocks.set(pc0, { pcend: opcode.nextpc, opcodes, states: [state] });
        } else {
            block.states.push(state);
        }
    }

    /**
     * Returns the `opcode`s present in the reacheable blocks of `bytecode`.
     *
     * **NOTE**. You must call either the `start`, `run` or `exec` methods first.
     * This is to populate the `bytecode`'s reacheable `blocks`.
     */
    opcodes(): Opcode<M>[] {
        if (this.blocks.size === 0)
            throw new Error('`blocks` is empty, call `start`, `run` or `exec` first');

        return [...this.blocks.values()]
            .flatMap(block => block.opcodes.map(o => o.opcode));
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
