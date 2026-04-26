import { strict as assert } from "assert";
import { arrayify } from "./bytes.ts";
import { Dispatch, type Opcode } from "./dispatch.ts";
import { Stack, State } from "./state.ts";

const zip = Object.fromEntries;
const range = (n: number) => [...Array(n).keys()];

function addLocal({ insts, stack }: State<Inst, Local>, expr: SExpr, pc: number) {
    const local = new Local(insts.length, expr);
    insts.push(new Def(local, pc));
    stack.push(local);
}

const sexpr = (inputs: number) => function (state: State<Inst, Local>, op: Opcode) {
    addLocal(state, new SExpr(op.mnemonic.toLowerCase(), state.stack.popn(inputs)), op.pc);
}

const sinst = (inputs: number) => function ({ insts, stack }: State<Inst, Local>, op: Opcode) {
    insts.push(new Inst(op.mnemonic.toLowerCase(), stack.popn(inputs), op.pc));
}

export const Frontier = new Dispatch({}).fork({
    STOP: { op: 0x00, step: sinst(0) },
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
    // BYTE: 0x1A,
    // SHA3: 0x20,
    // ADDRESS: 0x30,
    // BALANCE: [0x31, 0, true],
    // ORIGIN: 0x32,
    // CALLER: 0x33,
    CALLVALUE: { op: 0x34, step: sexpr(0) },
    // CALLDATALOAD: 0x35,
    // CALLDATASIZE: 0x36,
    // CALLDATACOPY: 0x37,
    // CODESIZE: 0x38,
    // CODECOPY: 0x39,
    // GASPRICE: 0x3A,
    // EXTCODESIZE: 0x3B,
    // EXTCODECOPY: 0x3C,
    // RETURNDATASIZE: 0x3D,
    // RETURNDATACOPY: 0x3E,
    // EXTCODEHASH: 0x3F,
    // BLOCKHASH: 0x40,
    // COINBASE: 0x41,
    // TIMESTAMP: 0x42,
    NUMBER: { op: 0x43, step: sexpr(0) },
    // DIFFICULTY: 0x44,
    // GASLIMIT: 0x45,
    POP: { op: 0x50, step: sinst(1) },
    MLOAD: { op: 0x51, step: sexpr(1) },
    MSTORE: { op: 0x52, step: sinst(2) },
    MSTORE8: { op: 0x53, step: sinst(2) },
    SLOAD: { op: 0x54, step: sexpr(1) },
    SSTORE: { op: 0x55, step: sinst(2) },
    JUMP: { op: 0x56, step: sinst(1) },
    JUMPI: { op: 0x57, step: sinst(2) },
    // PC: 0x58,
    // MSIZE: 0x59,
    // GAS: 0x5A,
    JUMPDEST: { op: 0x5B, step: sinst(0) },

    ...zip(range(32).map(i => [
        `PUSH${i + 1 as Size<32>}`, {
            op: 0x60 + i,
            size: i + 1,
            step: (state, op) => {
                assert(op.data !== undefined);
                assert(op.data.length === i + 1);
                addLocal(state, new Lit(BigInt('0x' + op.hexData())), op.pc)
            }
        }] as const)),
    ...zip(range(16).map(i => [
        `DUP${i + 1 as Size<16>}`,
        { op: 0x80 + i, step: ({ stack }) => stack.dup(i) }
    ] as const)),
    ...zip(range(16).map(i => [
        `SWAP${i + 1 as Size<16>}`,
        { op: 0x90 + i, step: ({ stack }) => stack.swap(i + 1) }
    ] as const)),
    ...zip(([0, 1, 2, 3, 4] as const).map(topics => [
        `LOG${topics}`,
        { op: 0xA0 + topics, step: sinst(2 + topics) }
    ] as const)),

    // CREATE: 0xF0,
    // CALL: 0xF1,
    // CALLCODE: 0xF2,
    // RETURN: 0xF3,
    // DELEGATECALL: 0xF4,
    // STATICCALL: 0xFA,
    // REVERT: 0xFD,
    INVALID: { op: 0xFE, step: sinst(0) },
    // SELFDESTRUCT: 0xFF,
} satisfies {
    [m: string]: {
        op: number,
        size?: number,
        step: (state: State<Inst, Local>, opcode: Opcode) => void
    }
});

export const Constantinople = Frontier.fork({
    SHL: { op: 0x1b, q: 2, x: 1 },
    SHR: { op: 0x1c, q: 1 },
    SAR: { op: 0x1d, size: 2, q: 4 },
    CREATE2: { op: 0xF5, q: 9 },
});

export const Istanbul = Constantinople.fork({
    CHAINID: { op: 0x46, q: 3 },
    SELFBALANCE: { op: 0x47, fn: () => 1, q: '' },
});

export const London = Istanbul.fork({
    BASEFEE: { op: 0x48 },
});

// export const Paris = London.build({
//     PREVRANDAO: 0x44,
// });

// export const ShanghaiStep = Paris.build({
//     PUSH0: [0x5F, 1, 0],
// });

class Printer {
    // https://gist.github.com/leommoore/4526808
    // https://en.wikipedia.org/wiki/ANSI_escape_code
    c = Object.fromEntries(Object.entries({
        bold: 1,
        dim: 2,
        red: 31,
        green: 32,
        yellow: 33,
        blue: 34,
        magenta: 35,
        cyan: 36,
    }).map(([name, color]) => [name, (text: unknown) => `\x1b[${color}m${text}\x1b[0m`]));

    strExpr(expr: unknown): string {
        if (expr instanceof Lit)
            return this.c.blue(`${expr.value}n`);
        else if (expr instanceof SExpr)
            return `${this.c.cyan(expr.ex + '(')}${expr.args.map(e => this.strExpr(e)).join(', ')}` + this.c.cyan(')');
        else if (expr instanceof Param)
            return `$${expr.id}_${expr.trigger}${expr.index}` + (expr.jumpdest ? '*jd' : '');
        else if (expr instanceof Local)
            return this.c.cyan(`%${expr.id}`) + (expr.copies === 1 ? `:${this.strExpr(expr.expr)}` : '');
        else
            return `${expr}`;
    }

    strInst(inst: unknown): string {
        const pc = () => this.c.dim(' // :' + (inst as Inst).pc);
        if (inst instanceof Def) {
            const t = (inst.local.rettarget ? 'rettarget' : '');
            return this.c.cyan(`%${inst.local.id}`) + this.c.dim(`|${inst.local.copies}:${inst.local.uses}`) + ` := ${this.strExpr(inst.local.expr)};${pc()}` + t;
        } else if (inst instanceof Inst) {
            const r = inst.isret ? ' ret' : '';
            return this.c.magenta(`${inst.fn}(`) + inst.args.map(e => this.strExpr(e)).join(', ') + this.c.magenta(')') + `;${pc()}` + r;
        } else {
            return `${inst}`;
        }
    }
}

export class SExpr {
    readonly ex: string;
    readonly args: Local[];
    constructor(ex: string, args: Local[]) {
        this.ex = ex;
        this.args = args;
    }
}

class Local {
    readonly id: number;
    readonly expr: SExpr;
    copies: number = 1;
    uses: number = 0;
    constructor(id: number, expr: SExpr) {
        this.id = id;
        this.expr = expr;
    }
}

class Lit extends SExpr {
    readonly value: bigint;
    constructor(value: bigint) {
        super('lit', []);
        this.value = value;
    }
}

class Param extends Local {
    readonly trigger: 'pop' | 'dup' | 'swap';
    readonly index: number;
    readonly arg: Local | undefined;
    constructor(id: number, trigger: Param['trigger'], index: number, arg: Local | undefined) {
        super(id, new SExpr(trigger, []));
        this.trigger = trigger;
        this.index = index;
        this.arg = arg;
    }
}

class Inst {
    readonly fn: string;
    readonly args: Local[];
    readonly pc: number;
    constructor(fn: string, args: Local[], pc: number) {
        this.fn = fn;
        this.args = args;
        this.pc = pc;
    }
}

class Def extends Inst {
    readonly local: Local;
    constructor(local: Local, pc: number) {
        super('local', [], pc);
        this.local = local;
        local.pc = pc;
    }
}

function halts(mnemonic: string): boolean {
    return ['STOP', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT'].includes(mnemonic);
}

class PhantomStack extends Stack<Local> {
    readonly params: Param[] = [];
    readonly args: Local[];

    constructor(args: Local[]) {
        super();
        this.args = args;
    }

    override pop(): Local {
        if (this.values.length === 0) {
            const param = new Param(this.params.length, 'pop', 0, this.args.shift());
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
            .map(i => new Param(this.params.length + i, trigger, i + this.values.length + 1, this.args.shift()));
    }
};

class Block {
    readonly pcend: number;
    readonly state: State<Inst, Local>;
    readonly params: Param[];
    readonly targets: number[];
    constructor(pcend: number, state: State<Inst, Local>, params: Param[], targets: number[]) {
        this.pcend = pcend;
        this.state = state;
        this.params = params;
        this.targets = targets;
    }

    get outs(): Local[] {
        return this.state.stack.values;
    }

    get unused(): Local[] {
        // TODO fix downcast
        return (this.state.stack as PhantomStack).args;
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

export function exec(bytecode: Parameters<typeof arrayify>[0], pc0: number, args: Local[], blocks: Map<number, Block>) {
    // let prevop = undefined;
    const buf = arrayify(bytecode);
    const stack = new PhantomStack(args);
    const state = new State<Inst, Local>(stack);

    // https://stackoverflow.com/questions/72659865/in-typescript-why-is-an-empty-array-inferred-as-any-when-noimplicitany-is-t

    const targets: number[] = [];
    let op;
    for (op of Frontier.decode(buf, pc0)) {
        // if (op.mnemonic === 'JUMP' || op.mnemonic === 'JUMPI') {
        //     if (prevop?.data === undefined) {
        //         console.log('dynamic jump', `${op}`);
        //     }
        // }
        // prevop = op;

        const { step } = Frontier.def[op.mnemonic as keyof typeof Frontier.def];
        step(state, op)
        console.log(`${op} |= ${state.stack}`);
        // insts.push(op);

        if (halts(op.mnemonic)) {
            break;
        } else if (op.mnemonic === 'JUMP' || op.mnemonic === 'JUMPI') {
            const last = state.last;
            assert(last !== undefined);
            assert(last.fn === 'jumpi' || last.fn === 'jump', `got ${last.fn}`);
            const [local] = last.args;
            assert(local !== undefined);
            // last.
            // console.log(state.last);
            // assert(state.last!.args);
            // const { args: [local] } = state.last!;
            // assert(local instanceof Local);
            if (local.expr instanceof Lit) {
                const dest = local.expr.value;
                console.log(dest);
                // TODO dest is in range and less than has valid jump type
                targets.push(Number(dest));
            } else {
                assert(local instanceof Param);
                local.jumpdest = true;
                console.log('dyn jump', local);
                assert(local.arg !== undefined);
                if (true) 1; else
                if (local.arg.expr instanceof Lit) {
                    const t = Number(local.arg.expr.value);
                    console.log('to', t);
                    local.arg.rettarget = true;
                    // TODO dest is in range and less than has valid jump type
                    targets.push(t);
                    const h = findHeaderPc(local.arg.pc, [...blocks.keys()]);
                    console.log(h);
                    const { pcend } = blocks.get(h)!;
                    console.log(pcend);
                    if (pcend === t) {
                        console.log('ret');
                        last.isret = true;
                    }
                }
            }
            if (op.mnemonic === 'JUMPI') {
                // TODO check target pc is within bytecode boundaries
                targets.push(op.pc + 1);
            }
            break;
        } else if (buf[op.nextpc] === Frontier.def.JUMPDEST.op) {
            targets.push(op.nextpc);
            break;
            // console.log('--- bb ---')
            // bbs.push({ insts, state, pc: insts[0].pc });
            // insts = [];
            // state = new LocalState(new PStack());
        }
    }
    assert(op !== undefined, 'empty block not allowed');
    const block = new Block(op.nextpc, state, stack.params, targets);
    return block;
}

function run0(bytecode: Parameters<typeof arrayify>[0]) {
    const blocks = new Map<number, Block>();
    const visits = new Map<number, { count: number }>();
    const frames = [{ pc: 0, args: [] as Local[] }];

    while (frames.length > 0) {
        const { pc, args } = frames.pop()!;
        const block = exec(bytecode, pc, args, blocks);
        if (visits.get(pc) === undefined) {
            visits.set(pc, { count: 0 });
        }
        visits.get(pc)!.count++;
        blocks.set(pc, block);
        // TODO avoid cycling on loops
        // TODO bubble up used args
        frames.push(...block.targets.map(pc => ({ pc, args: [...block.outs, ...block.unused] })));
    }

    const p = new Printer();
    for (const [pc, block] of blocks.entries()) {
        console.log(p.c.yellow('block_' + pc), '(' + block.params.map(e => p.strExpr(e)).join(', ') + ')');
        console.log('visited', visits.get(pc)!.count)
        for (const inst of block.state.insts) {
            console.log(`  ${p.strInst(inst)}`);
        }
        const un = '|= unused ' + `${block.unused.map(e => p.strExpr(e)).join(' | ')}`;
        console.log('  ->', block.targets, '|= outs', `${block.outs.map(e => p.strExpr(e)).join(' | ')}`, un);
        for (const pcdest of block.targets) {
            const t = blocks.get(pcdest);
            assert(t !== undefined);
            // if (t.params.length > block.outs.length) {
            //     console.log('  not enough args');
            // }
        }
    }
}

export function run(bytecode: Parameters<typeof arrayify>[0]) {
    run0(bytecode);
}