import { decode, OPCODES, type Opcode, MNEMONICS, fromHexString } from './opcode';
import { type Ram, State } from './state';
import { type Metadata, stripMetadataHash } from './metadata';

import { type Expr, type IInst, type Inst, Throw } from './ast/expr';
import { Branch, JumpDest } from './ast/flow';
import type { ISelectorBranches } from './step';

type FilterFn<T, F> = { [k in keyof T]: T[k] extends F ? k : never }[keyof T];
type Mnemonic<T> = FilterFn<T, (state: State<Inst, Expr>, opcode: Opcode) => void>;

/**
 * https://ethereum.github.io/execution-specs/autoapi/ethereum/index.html
 */
export class EVM<T extends
    {
        [opcode: number]: [size: number, halts: boolean, mnemonic: Mnemonic<T>];
        functionBranches: ISelectorBranches;
    } & {
        [m in Mnemonic<T>]: (state: State<Inst, Expr>, opcode: Opcode) => void;
    }
> {
    /**
     * The `metadataHash` part from the `bytecode`.
     * That is, if present, the `bytecode` without its `code`.
     */
    readonly metadata: Metadata | undefined;

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
    // readonly insts: (readonly [size: number, step: ((state: State<Inst, Expr>, opcode: Opcode) => void)])[];
    // readonly insts: IStep;

    /**
     *
     */
    readonly chunks = new Map<number, { pcend: number; states: State<Inst, Expr>[] }>();

    /**
     *
     */
    readonly errors: Throw[] = [];

    // readonly events: IEvents;
    // readonly variables: IStore['variables'];
    // readonly mappings: IStore['mappings'];
    // readonly functionBranches: ISelectorBranches;

    /**
     * The `Opcode[]` decoded from `bytecode`.
     */
    readonly opcodes: ReturnType<typeof decode>['opcodes'];

    /**
     * Jump destination (`JUMPDEST`) offsets found in `bytecode`.
     * This is used to speed up offset search.
     */
    readonly jumpdests: ReturnType<typeof decode>['jumpdests'];
    readonly buffer: Uint8Array;

    constructor(bytecode: string, readonly insts: T) {

    const start = bytecode.slice(0, 2) === '0x' ? 2 : 0;
    this.buffer = fromHexString(bytecode, start);

        const [code, metadata] = stripMetadataHash(bytecode);
        this.metadata = metadata;

        const { opcodes, jumpdests } = decode(code);
        jumpdests[0] = 0;

        this.opcodes = opcodes;
        this.jumpdests = jumpdests;
    }

    /**
     *
     */
    start(): State<Inst, Expr> {
        const state = new State<Inst, Expr>();
        this.run(0, state);
        for (const [, branch] of this.insts.functionBranches) {
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
        let pc = pc0;
        // for (; !state.halted && pc < this.opcodes.length; pc++) {
        for (; !state.halted && pc < this.buffer.length; pc++) {
            // opcode = this.opcodes[pc];
            const op = this.buffer[pc];
            const [size, ,mnemonic] = this.insts[op];
            const opcode= {opcode: op, pc, offset: pc, mnemonic: mnemonic as Opcode['mnemonic'], 
        
                      pushData: size === 0 ? null : (() => {
                          const data = this.buffer.subarray(pc + 1, pc + size + 1);
                          if (data.length !== size) throw new Error('asdfsadf');
                          pc += size;
                          return data;
                      })(),
        } as Opcode;


            const step = this.insts[mnemonic];
            // opcode.jumpdests = this.jumpdests;

            // step[0];
            try {
                step(state, opcode);
            } catch (err) {
                // console.log(err);
                const inv = new Throw((err as Error).message, opcode, state);
                state.halt(inv);
                this.errors.push(inv);
                // console.log(this.errors[0].state);
                continue;
            }

            if (!state.halted && this.buffer[pc + 1] === OPCODES.JUMPDEST) {
                const fallBranch = Branch.make(pc + 1, state);
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

    gc(b: Branch) {
        const chunk = this.chunks.get(b.pc);

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
