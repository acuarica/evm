import { strict as assert } from 'node:assert';

import { zip, mapValues, range } from './lib/object.ts';

import { Dispatch, type Opcode } from './decode.ts';
import { Stack } from './state.ts';
import { hexlify } from './bytes.ts';

type State = { insts: Inst[], stack: Stack<Local> };

function addLocal({ insts, stack }: State, expr: SExpr, pc: number) {
    const local = new Local(insts.length, expr);
    insts.push(new Def(local, pc));
    stack.push(local);
}

const sexpr = (inputs: number) => function (state: State, op: Opcode) {
    addLocal(state, new SExpr(op.mnemonic.toLowerCase(), state.stack.popn(inputs)), op.pc);
}

const sinst = (inputs: number) => function ({ insts, stack }: State, op: Opcode) {
    insts.push(new Inst(op.mnemonic.toLowerCase(), stack.popn(inputs), op.pc));
}

export class Printer {
    readonly #opts;
    constructor(opts: {
        expandSingleCopyLocal?: true,
        expandArgParam?: true,
        inlineSingleUseLocal?: true,
        showPcNumber?: true,
    } = {}) {
        this.#opts = opts;
    }

    strExpr(expr: unknown): string {
        if (expr instanceof Lit)
            return `${expr.value}n`;
        else if (expr instanceof SExpr)
            return `${expr.ex}(${expr.args.map(e => this.strExpr(e)).join(', ')})`;
        else if (expr instanceof Param)
            return `$${expr.id}_${expr.trigger}${expr.index}` + (expr.props['jumpdest'] ? '*jd' : '') + (this.#opts.expandArgParam && expr.arg !== undefined ? `:${this.strExpr(expr.arg)}` : '')
        else if (expr instanceof Local) {
            if (this.#opts.inlineSingleUseLocal && expr.copies === 1 && expr.uses === 1) {
                return this.strExpr(expr.expr);
            }
            return `%${expr.id}` + (this.#opts.expandSingleCopyLocal && expr.copies === 1 ? `:${this.strExpr(expr.expr)}` : '');
        } else
            return `${expr}`;
    }

    strInst(inst: unknown): string {
        const pc = this.#opts.showPcNumber
            ? () => ' // :' + (inst as Inst).pc
            : () => '';
        if (inst instanceof Def) {
            const g = inst.local.props['global'] !== undefined ? `_${inst.local.props['global']}` : '';
            const t = (inst.local.props['rettarget'] ? 'rettarget' : '');
            return `%${inst.local.id}${g}` + `|${inst.local.copies}:${inst.local.uses}` + ` := ${this.strExpr(inst.local.expr)};${pc()}` + t;
        } else if (inst instanceof Inst) {
            const r = inst.props['isret'] ? ' ret' : '';
            return `${inst.fn}(` + inst.args.map(e => this.strExpr(e)).join(', ') + ')' + `;${pc()}` + r;
        } else {
            return `${inst}`;
        }
    }
}

class Props {
    readonly props: { [prop: string]: unknown } = {};
}

export class SExpr extends Props {
    readonly ex: string;
    readonly args: Local[];
    constructor(ex: string, args: Local[]) {
        super();
        this.ex = ex;
        this.args = args;
    }

    [Symbol.iterator](): ArrayIterator<SExpr> {
        return this.args.map(e => e.expr)[Symbol.iterator]();
    }
}

export class Local extends Props {
    readonly id: number;
    readonly expr: SExpr;
    copies: number = 1;
    uses: number = 0;
    constructor(id: number, expr: SExpr) {
        super();
        this.id = id;
        this.expr = expr;
    }

    [Symbol.iterator](): ArrayIterator<SExpr> {
        return this.expr.args.map(e => e.expr)[Symbol.iterator]();
    }
}

export class Lit extends SExpr {
    readonly value: bigint;
    constructor(value: bigint) {
        super('lit', []);
        this.value = value;
    }
}

export class Param extends Local {
    readonly trigger: 'pop' | 'dup' | 'swap';
    readonly index: number;
    readonly arg: Local | undefined;
    constructor(id: number, trigger: Param['trigger'], index: number, arg: Local | undefined) {
        super(id, new SExpr(trigger, []));
        this.trigger = trigger;
        this.index = index;
        this.arg = arg;
        if (arg !== undefined) {
            arg.props['global'] = index + trigger + id;
        }
    }
}

export class Inst extends Props {
    readonly fn: string;
    readonly args: Local[];
    readonly pc: number;
    constructor(fn: string, args: Local[], pc: number) {
        super();
        this.fn = fn;
        this.args = args;
        this.pc = pc;
    }
}

export class Def extends Inst {
    readonly local: Local;
    constructor(local: Local, pc: number) {
        super('local', [], pc);
        this.local = local;
        local.props['pc'] = pc;
    }
}

function halts(mnemonic: string): boolean {
    return ['STOP', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT'].includes(mnemonic);
}

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
type StepFn = (state: State, opcode: Opcode) => void;

type Step<M extends string> = {
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
        const state = { insts: [] as Inst[], stack: new ParamStack(args) } satisfies State;
        // state.stack.args.id = this.id++;

        const targets: { pc: number, pushpc: number, dynamic: boolean }[] = [];
        let op;
        for (op of this.#step.decode(this.#bytecode, pc0)) {
            this.#step[op.mnemonic](state, op);
            // if (state.)

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
        let id = 0;
        const pc = 0;
        const frames = [{ pc, args: new ArgsStack(id++), path: [{ pc, id }] }];

        while (frames.length > 0) {
            const { pc, args, path } = frames.shift()!;
            // args.id = id++;
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
                    destpc.args = new ArgsStack(id++, [...block.outs, ...block.unused]);
                    frames.unshift({ pc: destpc.pc, args: destpc.args, path: [...p, { pc: destpc.pc, id: destpc.args.id }] });
                } else {
                    destpc.args = new ArgsStack(e.id, [...block.outs, ...block.unused]);
                }
            }
            // frames.push(...block.targets.map(({ pc }) => ({ pc, args: new Stack([...block.outs, ...block.unused]) })));
        }

        return this.states;
    }
}

export function print(bbs: Map<number, Block[]>): string {
    const p = new Printer({
        // expandSingleCopyLocal: true,
        expandArgParam: true,
        showPcNumber: true,
    });
    let out = '';
    for (const [pc, blocks] of bbs.entries()) {
        for (const block of blocks) {
            out += `pc :${pc} <s_${block.id}> [${block.params.length}] |= (${block.params.map(e => p.strExpr(e)).join(' | ')})\n`;
            for (const inst of block.insts) {
                out += `  ${p.strInst(inst)}` + '\n';
            }
            const un = '|= unused ' + `${block.unused.map(e => p.strExpr(e)).join(' | ')}`;
            // out += '  ->' + block.targets + '|= outs' + `${block.outs.map(e => p.strExpr(e)).join(' | ')}` + un + '\n';
            out += '  |= outs ' + `${block.outs.map(e => p.strExpr(e)).join(' | ')} ` + un + '\n';
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

function ForkFactory<M extends string>(
    def: { [m in M]: { op: number, step: StepFn } },
) {
    class Fork extends Dispatch<M> {
        static def = def;
        constructor() {
            super(def, 'a' as M);
        }
    }
    Object.assign(Fork.prototype, mapValues(def, op => op.step));
    return Fork as (new () => Dispatch<M> & Step<M>) & { def: typeof def };
}

function shalt(inputs: number) {
    const fn = sinst(inputs);
    return (state: State, opcode: Opcode) => {
        fn(state, opcode);
        // state.halt();
    }
}

export const Flow = ForkFactory({
    POP: { op: 0x50, step: sinst(1) },
    JUMP: { op: 0x56, step: sinst(1) },
    JUMPI: { op: 0x57, step: sinst(2) },
    JUMPDEST: { op: 0x5B, step: sinst(0) },
    ...zip(range(32).map(i => [
        `PUSH${i + 1 as Size<32>}`,
        { op: 0x60 + i, size: i + 1, step: (state, op) => addLocal(state, new Lit(BigInt('0x' + hexlify(op.data!))), op.pc) }
    ] as const)),
    ...zip(range(16).map(i => [
        `DUP${i + 1 as Size<16>}`,
        { op: 0x80 + i, step: ({ stack }) => stack.dup(i) }
    ] as const)),
    ...zip(range(16).map(i => [
        `SWAP${i + 1 as Size<16>}`,
        { op: 0x90 + i, step: ({ stack }) => stack.swap(i + 1) }
    ] as const)),
    INVALID: { op: 0xfe, step: shalt(0) },
});

export const Frontier = ForkFactory({
    ...Flow.def,
    STOP: { op: 0x00, step: shalt(0) },
    ADD: { op: 0x01, step: sexpr(2) },
    MUL: { op: 0x02, step: sexpr(2) },
    SUB: { op: 0x03, step: sexpr(2) },
    DIV: { op: 0x04, step: sexpr(2) },
    SDIV: { op: 0x05, step: sexpr(2) },
    MOD: { op: 0x06, step: sexpr(2) },
    SMOD: { op: 0x07, step: sexpr(2) },
    ADDMOD: { op: 0x08, step: sexpr(3) },
    MULMOD: { op: 0x09, step: sexpr(3) },
    EXP: { op: 0x0A, step: sexpr(2) },
    SIGNEXTEND: { op: 0x0B, step: sexpr(2) },
    LT: { op: 0x10, step: sexpr(2) },
    GT: { op: 0x11, step: sexpr(2) },
    SLT: { op: 0x12, step: sexpr(2) },
    SGT: { op: 0x13, step: sexpr(2) },
    EQ: { op: 0x14, step: sexpr(2) },
    ISZERO: { op: 0x15, step: sexpr(1) },
    AND: { op: 0x16, step: sexpr(2) },
    OR: { op: 0x17, step: sexpr(2) },
    XOR: { op: 0x18, step: sexpr(2) },
    NOT: { op: 0x19, step: sexpr(1) },
    BYTE: { op: 0x1A, step: sexpr(2) },
    SHA3: { op: 0x20, step: sexpr(2) },
    ADDRESS: { op: 0x30, step: sexpr(0) },
    BALANCE: { op: 0x31, step: sexpr(1) },
    ORIGIN: { op: 0x32, step: sexpr(0) },
    CALLER: { op: 0x33, step: sexpr(0) },
    CALLVALUE: { op: 0x34, step: sexpr(0) },
    CALLDATALOAD: { op: 0x35, step: sexpr(1) },
    CALLDATASIZE: { op: 0x36, step: sexpr(0) },
    CALLDATACOPY: { op: 0x37, step: sinst(3) },
    CODESIZE: { op: 0x38, step: sexpr(0) },
    CODECOPY: { op: 0x39, step: sinst(3) },
    GASPRICE: { op: 0x3A, step: sexpr(0) },
    EXTCODESIZE: { op: 0x3B, step: sexpr(1) },
    EXTCODECOPY: { op: 0x3C, step: sinst(4) },
    RETURNDATASIZE: { op: 0x3D, step: sexpr(0) },
    RETURNDATACOPY: { op: 0x3E, step: sinst(3) },
    EXTCODEHASH: { op: 0x3F, step: sexpr(1) },
    BLOCKHASH: { op: 0x40, step: sexpr(1) },
    COINBASE: { op: 0x41, step: sexpr(0) },
    TIMESTAMP: { op: 0x42, step: sexpr(0) },
    NUMBER: { op: 0x43, step: sexpr(0) },
    DIFFICULTY: { op: 0x44, step: sexpr(0) },
    GASLIMIT: { op: 0x45, step: sexpr(0) },
    MLOAD: { op: 0x51, step: sexpr(1) },
    MSTORE: { op: 0x52, step: sinst(2) },
    MSTORE8: { op: 0x53, step: sinst(2) },
    SLOAD: { op: 0x54, step: sexpr(1) },
    SSTORE: { op: 0x55, step: sinst(2) },
    PC: { op: 0x58, step: sexpr(0) },
    MSIZE: { op: 0x59, step: sexpr(0) },
    GAS: { op: 0x5A, step: sexpr(0) },
    ...zip(([0, 1, 2, 3, 4] as const).map(topics => [
        `LOG${topics}`,
        { op: 0xA0 + topics, step: sinst(2 + topics) }
    ] as const)),
    CREATE: { op: 0xF0, step: sexpr(3) },
    CALL: { op: 0xF1, step: sexpr(7) },
    CALLCODE: { op: 0xF2, step: sexpr(7) },
    RETURN: { op: 0xF3, step: shalt(2) },
    DELEGATECALL: { op: 0xF4, step: sexpr(6) },
    STATICCALL: { op: 0xFA, step: sexpr(6) },
    REVERT: { op: 0xFD, step: shalt(2) },
    SELFDESTRUCT: { op: 0xFF, step: shalt(1) },
});

const Constantinople = ForkFactory({
    ...Frontier.def,
    SHL: { op: 0x1b, step: sexpr(2) },
    SHR: { op: 0x1c, step: sexpr(2) },
    SAR: { op: 0x1d, step: sexpr(2) },
    CREATE2: { op: 0xF5, step: sexpr(3) },
});

export const Istanbul = ForkFactory({
    ...Constantinople.def,
    CHAINID: { op: 0x46, step: sexpr(0) },
    SELFBALANCE: { op: 0x47, step: sexpr(0) },
});

export const London = ForkFactory({
    ...Istanbul.def,
    BASEFEE: { op: 0x48, step: sexpr(0) },
});

export const Paris = ForkFactory({
    ...London.def,
    PREVRANDAO: { op: 0x44, step: sexpr(0) },
});

export const Shanghai = ForkFactory({
    ...Paris.def,
    PUSH0: { op: 0x5F, step: (state, op) => addLocal(state, new Lit(0n), op.pc) },
});

export const JMP = <TBase extends Cons<'JUMPI'>>(A: TBase) => class extends A {

    readonly publicFunctions: Map<string, { pc: number, state: State }> = new Map();

    JUMPI = (state: State, opcode: Opcode) => {
        super.JUMPI(state, opcode);
        const [offset, cond] = state.insts.at(-1)!.args;

        const selector = cond.props['selector'];
        if (typeof selector === 'string') {
            // const [pc, contBranch] = cond.positive ? [destpc, fallBranch] : [opcode.pc + 1, destBranch];
            if (offset instanceof Lit) {
                const pc = Number(offset.value);
                this.publicFunctions.set(selector, {
                    pc,
                    state: state,
                });
            }
        }
    }
};

export const DivExpEQ = <TBase extends Cons<'EQ'>>(A: TBase) => class extends A {
    EQ = (state: State, opcode: Opcode) => {
        super.EQ(state, opcode);

        const [left, right] = state.stack.top!;

        const rr = right.args[1];
        if (left instanceof Lit && right.ex === 'div' && rr.expr instanceof Lit) {
            const selector = left.value * rr.expr.value;
            const r = right.args[0].expr;

            if (selector % (1n << 0xe0n) === 0n &&
                r.ex === 'calldataload' &&
                r.args[0].expr instanceof Lit &&
                r.args[0].expr.value === 0n
            ) {
                const s = selector
                    .toString(16)
                    .substring(0, 8 - (64 - selector.toString(16).length))
                    .padStart(8, '0');
                console.log(s);
            }
        }
    }
};

function isZero(expr: SExpr) {
    return expr instanceof Lit && expr.value === 0n;
}

function isSelectorCallData(expr: SExpr) {
    const [shift, value] = expr;

    console.log(shift, value.args);
    return expr.ex === 'shr' &&
        shift instanceof Lit &&
        shift.value === 0xe0n &&
        value.ex === 'calldataload' &&
        isZero(value.args[0].expr);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cons<M extends string> = new (...args: any[]) => Record<M, StepFn>;

export const ShrEQ = <TBase extends Cons<'EQ'>>(A: TBase) => class extends A {
    override EQ = (state: State, opcode: Opcode) => {
        super.EQ(state, opcode);

        const SHRsig = (left: SExpr, right: SExpr): string | undefined => {
            console.log(left, right);
            return left instanceof Lit && isSelectorCallData(right)
                ? left.value.toString(16).padStart(8, '0')
                : undefined;
        };
        const [left, right] = state.stack.top!;
        const sig = SHRsig(left, right) ?? SHRsig(right, left);
        if (sig !== undefined) {
            state.stack.top!.props['selector'] = sig;
        }
    }
};

export function run(bytecode: Uint8Array) {
    // const A = ShrEQ(DivExpEQ(JMP(Shanghai)));
    // const a = new A();
    // a.functionBranches.
    return new Sevm(new (ShrEQ(DivExpEQ(JMP(Shanghai))))(), bytecode).run();
}