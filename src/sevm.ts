import { strict as assert } from 'node:assert';

import { range } from './lib/object.ts';

import { Dispatch, type Opcode } from './decode.ts';
import { Stack } from './state.ts';
import { Inst, Local, Param, Lit, Printer } from './sexpr.ts';

class ParamStack extends Stack<Local> {
    readonly params: Param[] = [];
    readonly pc0: number;
    readonly args: Stack<Local>;

    constructor(pch: number, args: Stack<Local>) {
        super();
        this.pc0 = pch;
        this.args = args;
    }

    override pop(): Local {
        if (this.values.length === 0) {
            const param = new Param(this.pc0, this.params.length, 'pop', 0, this.args.pop());
            this.params.push(param);
            super.push(param);
        }
        this.top!.uses++;
        return super.pop();
    }

    override dup(position: number): void {
        if (position >= this.values.length) {
            const params = this.newParams(position + 1, 'dup');
            this.params.push(...params);
            this.values.push(...params);
        }

        super.dup(position);
        this.top!.copies++;

        assert(this.top!.jumpdest === undefined, 'dupping jumpdest');
    }

    override swap(secondPosition: number): void {
        if (secondPosition >= this.values.length) {
            const params = this.newParams(secondPosition + 1, 'swap');
            this.params.push(...params);
            this.values.push(...params);
        }
        super.swap(secondPosition);
    }

    newParams(pos: number, trigger: 'dup' | 'swap' | 'propagate'): Param[] {
        return range(pos - this.values.length)
            .map(i => new Param(this.pc0, this.params.length + i, trigger, i + this.values.length + 1, this.args.pop()));
    }

    newParams2(n: number): Param[] {
        return range(n).map(i => new Param(this.pc0, this.params.length + i, 'propagate', i + this.values.length + 1, this.args.pop()));
    }
}

export class State {
    readonly pcbegin: number;
    readonly insts: Inst[] = [];
    readonly pstack: ParamStack;
    // readonly targets = [];
    id: number = -5;

    readonly branches: { state?: State, pc: number, pushpc: number, dynamic: boolean }[] = [];

    //  { pc: number, pushpc: number, args?: ArgsStack, dynamic: boolean }[]) 
    pcend?: number;

    constructor(pch: number, args = new Stack<Local>()) {
        this.pcbegin = pch;
        this.pstack = new ParamStack(pch, args);
    }

    get stack(): Stack<Local> {
        return this.pstack;
    }

    get params(): Param[] {
        return this.pstack.params;
    }

    get outs(): Local[] {
        return this.pstack.values;
    }

    get unused(): Local[] {
        return this.pstack.args.values;
    }

    get last(): Inst {
        const inst = this.insts.at(-1);
        assert(inst !== undefined);
        return inst;
    }

    pushBranch(pc: number, pushpc: number, dynamic: boolean): void {
        this.branches.push({ pc, pushpc, dynamic })
    }
};

function findHeaderPc(pc: number, blocks: number[]) {
    blocks.sort((l, r) => l - r);
    assert(blocks.length > 0);
    assert(blocks[0] === 0);
    let i = 0;
    for (; i < blocks.length && blocks[i] <= pc; i++);
    return blocks[i - 1];
}

/**
 * The step transition function.
 * 
 * The `EVM` executes a `StepFn` transition for each `opcode` found in the `evm.bytecode`.
 * It should change the `state` accordingly to the `opcode` found.
 */
export type StepFn = (state: State, opcode: Opcode) => Inst | undefined;

export type Step<M extends string> = {
    readonly [m in M]: StepFn;
}

/**
 * 
 */
export class Sevm<M extends string> {

    /**
     * 
     */
    readonly #bytecode: Uint8Array;

    /**
     * 
     */
    readonly states = new Map<number, State[]>();
    readonly #step;

    constructor(step: Dispatch<M> & Step<M>, bytecode: Uint8Array) {
        this.#step = step;
        this.#bytecode = bytecode;
    }

    static #halts(mnemonic: string): boolean {
        return ['STOP', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT'].includes(mnemonic);
    }

    #exec(state: State): void {
        const validatejd = (pc: number): boolean => {
            if (this.#bytecode[pc] !== 0x5b) {
                console.log('not valid jumpdest');
                return false;
            }
            return true;
        }

        const ops = this.#step.ops as Record<'JUMP' | 'JUMPI' | 'JUMPDEST', number>;

        let op;
        for (op of this.#step.decode(this.#bytecode, state.pcbegin)) {
            const inst = this.#step[op.mnemonic](state, op);
            if (inst !== undefined) {
                state.insts.push(inst);
            }

            if (Sevm.#halts(op.mnemonic)) {
                break;
            } else if (op.op === ops.JUMP || op.op === ops.JUMPI) {
                // const jmp = state.last;
                const jmp = inst;
                assert(jmp !== undefined);
                assert(jmp.fn === 'jumpi' || jmp.fn === 'jump', `got ${jmp.fn}`);
                const [dest] = jmp.args;
                assert(dest !== undefined);
                if (!(dest instanceof Param)) {
                    if (!(dest.expr instanceof Lit)) {
                        const p = new Printer({ inlineSingleUseLocal: true })
                        throw Error(`dest expr not lit ${p.strExpr(dest.expr)}`);
                    }

                    dest.jumpdest = 'direct';
                    const destpc = dest.expr.value;
                    // TODO dest is in range and less than has valid jump type

                    if (validatejd(Number(destpc)))
                        state.pushBranch(Number(destpc), op.pc, false);
                } else {
                    assert(dest instanceof Param);
                    dest.jumpdest = 'indirect';
                    assert(dest.arg !== undefined);
                    dest.arg.jumpdest = 'indirect';
                    if (dest.arg.expr instanceof Lit) {
                        const t = Number(dest.arg.expr.value);
                        dest.arg.rettarget = true;
                        // TODO dest is in range and less than has valid jump type

                        // const h = findHeaderPc(dest.arg.pc!, [...this.states.keys()]);
                        // assert(h === dest.arg.pch, `for ${dest.arg.pc}: ${h} !== ${dest.arg.pch} in ${[...this.states.keys()]}`);
                        // const [{ pcend }] = this.states.get(h)!;
                        // if (pcend === t) {
                        //     jmp.ret = true;
                        // }

                        if (validatejd(t))
                            state.pushBranch(t, dest.arg.pc!, true);
                    }
                }
                if (op.op === ops.JUMPI) {
                    // TODO check target pc is within bytecode boundaries
                    state.pushBranch(op.pc + 1, state.pcbegin, false);
                }
                break;
            } else if (this.#bytecode[op.nextpc] === ops.JUMPDEST) {
                state.pushBranch(op.nextpc, state.pcbegin, false);
                break;
            }
        }
        assert(op !== undefined, 'empty block not allowed');
        state.pcend = op.nextpc;
    }

    run(): Map<number, State[]> {
        let id = 0;
        const s0 = new State(0);
        const frames = [{ state: s0, path: [s0] }];

        let maxpath = 0;
        while (frames.length > 0) {
            const { state, path } = frames.pop()!;
            if (path.length > maxpath) {
                maxpath = path.length;
                console.log('longest path', maxpath, 'states');
            }

            this.#exec(state);
            state.id = id++;
            if (id % 10000 === 0) {
                console.log('reached', id, 'states', 'across', this.states.size, 'blocks', 'frames in queue', frames.length);
            }

            {
                let clones = this.states.get(state.pcbegin);
                if (clones === undefined) {
                    clones = [];
                    this.states.set(state.pcbegin, clones);
                }
                clones.push(state);
                if (clones.length % 5000 === 0) {
                    console.log('reached', clones.length, 'for block', state.pcbegin);
                }
            }

            for (const br of state.branches) {
                const p = br.dynamic ? [] : path;
                const e = p.find(e => e.pcbegin === br.pc);
                if (e === undefined) {
                    const brState = new State(br.pc, new Stack([...state.outs, ...state.unused]));
                    br.state = brState;
                    frames.push({ state: brState, path: [...p, brState] });
                } else {
                    br.state = e;
                }
            }
        }

        return this.states;
    }

    go(): Map<number, State[]> {
        function match(clargs: Local[], args: Local[], matchfn: (x: Local, y: Local) => boolean) {
            for (let i = 0; i < clargs.length; i++) {
                if (clargs[i].jumpdest !== undefined) {
                    // assert(clargs[i].jumpdest === 'indirect', clargs[i].jumpdest);
                    if (args[i] === undefined)
                        return false;
                    if (!matchfn(clargs[i], args[i]))
                        return false;
                }
            }
            return true;
        }

        let id = 0;

        let maxpath = 0;
        const _run = (state: State, path: State[]): State => {
            if (path.length > maxpath) {
                maxpath = path.length;
                console.log('longest path', maxpath, 'states');
            }

            this.#exec(state);
            state.id = id++;

            let clones = this.states.get(state.pcbegin);
            if (clones === undefined) {
                clones = [];
                this.states.set(state.pcbegin, clones);
            }

            for (const clone of clones) {
                assert(state.params.length === clone.params.length, 'params len');
                assert(state.outs.length === clone.outs.length, 'params len');
                if (match(clone.params, state.params, (x, y) => x === y) &&
                    match(clone.outs, state.outs, (x, y) => x.expr instanceof Lit && y.expr instanceof Lit && x.expr.value === y.expr.value) &&
                    match(clone.unused, state.unused, (x, y) => x === y)
                ) {
                    return clone;
                }
            }

            clones.push(state);

            if (id % 10_000 === 0) {
                console.log('reached', id, 'states', 'across', this.states.size, 'blocks');
            }

            // let maxps = 0;
            for (const br of [...state.branches].reverse()) {
                const p = br.dynamic ? [] : path;
                const e = p.find(e => e.pcbegin === br.pc);
                if (e === undefined) {
                    const brState = new State(br.pc, new Stack([...state.outs, ...state.unused]));
                    // _run(brState, [...p, brState]);
                    // br.state = brState;
                    br.state = _run(brState, [...p, brState]);

                    // !dynamic
                    // if (brState.params.length > maxps) {
                    //     maxps = brState.params.length;
                    // }
                } else {
                    br.state = e;
                }
            }

            // const outargs = state.outs;
            // // const unusedargs = state.unused;
            // // const args = [...outargs, ...unusedargs];
            // if (maxps > outargs.length) {
            //     // state.pstack.popn(brState.params.length - state.params.length)
            //     // const n = brState.params.length - state.params.length;
            //     const ps = state.pstack.newParams2(maxps - outargs.length);
            //     // const ps2 = brState.params.slice(outargs.length);

            //     state.pstack.params.push(...ps);
            //     // state.pstack.values.push(...ps);
            // }

            return state;
        }

        const s0 = new State(0);
        _run(s0, [s0]);

        return this.states;
    }
}

export function print(bbs: Map<number, State[]>): string {
    const p = new Printer({
        // expandSingleCopyLocal: true,
        expandArgParam: true,
        showPcNumber: true,
    });
    let out = '';
    const entries = [...bbs.entries()].sort((x, y) => x[0] - y[0]);
    for (const [pc, blocks] of entries) {
        let printBlock = true;
        for (const block of blocks) {
            if (printBlock) {
                out += `pc :${pc}\n`;
                for (const inst of block.insts) {
                    out += `  ${p.strInst(inst)}` + '\n';
                }
                printBlock = false;
            }
            out += `  <s_${block.id}> [${block.params.length}] |= (${block.params.map(e => p.strExpr(e)).join(' | ')})\n`;
            const un = '|= unused ' + `${block.unused.map(e => p.strExpr(e)).join(' | ')}`;
            // out += '  ->' + block.targets + '|= outs' + `${block.outs.map(e => p.strExpr(e)).join(' | ')}` + un + '\n';
            out += '    |= outs ' + `${block.outs.map(e => p.strExpr(e)).join(' | ')} ` + un + '\n';
            for (const pcdest of block.branches) {
                const t = bbs.get(pcdest.pc);
                assert(t !== undefined);
                // if (t.params.length > block.outs.length) {
                //     console.log('  not enough args');
                // }
            }
        }
    }

    return out;
}

// function shalt(inputs: number) {
//     const fn = sinst(inputs);
//     return (state: State, opcode: Opcode) => {
//         fn(state, opcode);
//         state.halted = true;
//         // state.halt();
//     }
// }
