import { strict as assert } from 'node:assert';

import { range } from './lib/object.ts';

import { Dispatch, type Opcode } from './decode.ts';
import { Stack } from './state.ts';
import { Inst, Local, Param, Lit, Printer } from './sexpr.ts';

export type State = { halted: boolean, insts: Inst[], stack: Stack<Local>, branches: [] };

class ArgsStack extends Stack<Local> {
    id: number = -1;
    constructor(id: number, values: Local[] = []) {
        super(values);
        this.id = id;
    }
}

class ParamStack extends Stack<Local> {
    readonly params: Param[] = [];
    readonly args: ArgsStack;

    constructor(args: ArgsStack) {
        super();
        this.args = args;
    }

    override pop(): Local {
        if (this.values.length === 0) {
            const param = new Param(this.params.length, 'pop', 0, this.args.pop());
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
    }

    override swap(secondPosition: number): void {
        if (secondPosition >= this.values.length) {
            const params = this.newParams(secondPosition + 1, 'swap');
            this.params.push(...params);
            this.values.push(...params);
        }
        super.swap(secondPosition);
    }

    private newParams(pos: number, trigger: 'dup' | 'swap'): Param[] {
        return range(pos - this.values.length)
            .map(i => new Param(this.params.length + i, trigger, i + this.values.length + 1, this.args.pop()));
    }
}

export class Block {
    private readonly state;
    readonly pcend: number;
    readonly targets;
    constructor(pcend: number, state: { insts: Inst[], stack: ParamStack }, targets: { pc: number, pushpc: number, args?: ArgsStack, dynamic: boolean }[]) {
        this.pcend = pcend;
        this.state = state;
        this.targets = targets;
    }

    get id() {
        return this.state.stack.args.id;
    }

    get insts(): Inst[] {
        return this.state.insts;
    }

    get params(): Param[] {
        return this.state.stack.params;
    }

    get outs(): Local[] {
        return this.state.stack.values;
    }

    get unused(): Local[] {
        return this.state.stack.args.values;
    }
}

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
export type StepFn = (state: State, opcode: Opcode) => void;

export type Step<M extends string> = {
    // readonly ops: { readonly [m in M]: { op: number, size?: number } };
    // } & {
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
    readonly states = new Map<number, Block[]>();
    // readonly #fork: Dispatch<M>;
    readonly #step;

    constructor(step: Dispatch<M> & Step<M>, bytecode: Uint8Array) {
        this.#step = step;
        // this.#fork = new Dispatch(step.ops, 'INVALID');
        this.#bytecode = bytecode;
    }

    exec(pc0: number, args: ArgsStack): Block {
        const ops = this.#step.ops as Record<'JUMP' | 'JUMPI' | 'JUMPDEST', number>;
        const state = { halted: false, insts: [] as Inst[], stack: new ParamStack(args), branches: [] } satisfies State;
        // state.stack.args.id = this.id++;

        const targets: { pc: number, pushpc: number, dynamic: boolean }[] = [];
        let op;
        for (op of this.#step.decode(this.#bytecode, pc0)) {
            this.#step[op.mnemonic](state, op);

            if (halts(op.mnemonic)) {
                break;
            } else if (op.op === ops.JUMP || op.op === ops.JUMPI) {
                const jmp = state.insts.at(-1);
                assert(jmp !== undefined);
                assert(jmp.fn === 'jumpi' || jmp.fn === 'jump', `got ${jmp.fn}`);
                const [local] = jmp.args;
                assert(local !== undefined);
                if (local.expr instanceof Lit) {
                    local.props['isjd'] = true;
                    const dest = local.expr.value;
                    // TODO dest is in range and less than has valid jump type
                    targets.push({ pc: Number(dest), pushpc: op.pc, dynamic: false });
                } else {
                    assert(local instanceof Param);
                    local.props['jumpdest'] = true;
                    assert(local.arg !== undefined);
                    if (local.arg.expr instanceof Lit) {
                        const t = Number(local.arg.expr.value);
                        local.arg.props['rettarget'] = true;
                        // TODO dest is in range and less than has valid jump type
                        const h = findHeaderPc(local.arg.props['pc'] as number, [...this.states.keys()]);
                        const [{ pcend }] = this.states.get(h)!;
                        if (pcend === t) {
                            jmp.props['isret'] = true;
                        }
                        targets.push({ pc: t, pushpc: local.arg.props['pc'] as number, dynamic: true });
                    }
                }
                if (op.op === ops.JUMPI) {
                    // TODO check target pc is within bytecode boundaries
                    targets.push({ pc: op.pc + 1, pushpc: pc0, dynamic: false });
                }
                break;
            } else if (this.#bytecode[op.nextpc] === ops.JUMPDEST) {
                targets.push({ pc: op.nextpc, pushpc: pc0, dynamic: false });
                break;
            }
        }
        assert(op !== undefined, 'empty block not allowed');
        return new Block(op.nextpc, state, targets);
    }

    run(): Map<number, Block[]> {
        const ids = new WeakMap<Stack<Local>, number>();
        let id = 0;
        const pc = 0;
        const frames = [{ pc, args: new ArgsStack(-2), path: [{ pc, id }] }];
        ids.set(frames[0].args, id++);

        while (frames.length > 0) {
            const { pc, args, path } = frames.pop()!;
            args.id = id++;
            const block = this.exec(pc, args);
            {
                let clones = this.states.get(pc);
                if (clones === undefined) {
                    clones = [];
                    this.states.set(pc, clones);
                }
                clones.push(block);
            }

            for (const destpc of block.targets) {
                // const arrow = `${pc}->${destpc.pc}`;
                // const d = destpc.dynamic ? '==' : '--';
                // console.log('  pc' + pc, ` ${d}${destpc.pushpc}${d}> `, 'pc' + destpc.pc);
                const p = destpc.dynamic ? [] : path;
                const e = p.find(e => e.pc === destpc.pc);
                if (e === undefined) {
                    destpc.args = new ArgsStack(-3, [...block.outs, ...block.unused]);
                    frames.push({ pc: destpc.pc, args: destpc.args, path: [...p, { pc: destpc.pc, id: destpc.args.id }] });
                } else {
                    destpc.args = new ArgsStack(e.id, [...block.outs, ...block.unused]);
                }
            }
            // frames.push(...block.targets.map(({ pc }) => ({ pc, args: new Stack([...block.outs, ...block.unused]) })));
        }

        return this.states;
    }
}

interface IState {
    // readonly branches: [number, this][];
    breaks: undefined | [number, this][];
}

export function* sevm<M extends string, S extends IState>(
    bytecode: Uint8Array,
    pc0: number,
    s0: S,
    step: Dispatch<M> & { [m in M]: (state: S, opcode: Opcode) => void },
) {
    const frames = [[pc0, s0] as const];

    while (frames.length > 0) {
        const [pc, state] = frames.pop()!;
        // const state = { insts: [] as Inst[], stack: new ParamStack(args) } satisfies State;
        // const targets: { pc: number, pushpc: number, dynamic: boolean }[] = [];
        for (const op of step.decode(bytecode, pc)) {
            step[op.mnemonic](state, op);
            if (state.breaks !== undefined) {
                break;
            }
        }

        yield state;

        frames.push(...state.breaks!);
    }
}

export function print(bbs: Map<number, Block[]>): string {
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
            for (const pcdest of block.targets) {
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

function halts(mnemonic: string): boolean {
    return ['STOP', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT'].includes(mnemonic);
}

// function shalt(inputs: number) {
//     const fn = sinst(inputs);
//     return (state: State, opcode: Opcode) => {
//         fn(state, opcode);
//         state.halted = true;
//         // state.halt();
//     }
// }
