import { arrayify } from "./bytes.ts";
import { Opcodes, type IPushOpcode } from "./decode.ts";

import { Stack, State } from "./state.ts";

// const t = {
//     STOP: [0x00, 0, 0],
//     ADD: [0x01, 2, 1],
//     MUL: [0x02, 2, 1],
// }
// const u = Object.fromEntries(Object.entries(t).map(([k, [s]]) => [k, s]));
// export const h = new Opcodes().build(u);

function table<T extends { [k: string]: [number | { opcode: number, size: number }, number, boolean | unknown] }>(tbl: T) {
    const u = Object.fromEntries(Object.entries(tbl).map(([k, [s]]) => [k, s] as const));
    return [u, tbl] as const;
}

export const F = {
    STOP: [0x00, 0, false],
    ADD: [0x01, 2, true],
    MUL: [0x02, 2, true],
    SUB: [0x03, 2, true],
    DIV: [0x04, 2, true],
    SDIV: [0x05, 2, true],
    MOD: [0x06, 2, true],
    SMOD: [0x07, 2, true],
    // ADDMOD: [0x08],
    // MULMOD: [0x09],
    EXP: [0x0A, 2, true],
    // SIGNEXTEND: [0x0B],
    LT: [0x10, 2, true],
    GT: [0x11, 2, true],
    // SLT: [0x12, 2, true],
    // SGT: [0x13, 2, true],
    EQ: [0x14, 2, true],
    ISZERO: [0x15, 1, true],
    AND: [0x16, 2, true],
    OR: [0x17, 2, true],
    XOR: [0x18, 2, true],
    NOT: [0x19, 1, true],
    // BYTE: 0x1A,
    // SHA3: 0x20,
    // ADDRESS: 0x30,
    // BALANCE: [0x31, 0, true],
    // ORIGIN: 0x32,
    // CALLER: 0x33,
    CALLVALUE: [0x34, 0, true],
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
    NUMBER: [0x43, 0, true],
    // DIFFICULTY: 0x44,
    // GASLIMIT: 0x45,
    POP: [0x50, 1, false],
    MLOAD: [0x51, 1, true],
    MSTORE: [0x52, 2, false],
    MSTORE8: [0x53, 2, false],
    SLOAD: [0x54, 1, true],
    SSTORE: [0x55, 2, false],
    JUMP: [0x56, 1, false],
    JUMPI: [0x57, 2, false],
    // PC: 0x58,
    // MSIZE: 0x59,
    // GAS: 0x5A,
    JUMPDEST: [0x5B, 0, false],

    ...Object.fromEntries([...Array(32).keys()].map(size => [`PUSH${(size + 1 as Size<32>)}`, [
        {
            opcode: 0x60 + size, size: size + 1
        },
        0,
        (s: LocalState, op: { hexData: () => string | undefined }) => s.addLocal(new Lit(BigInt('0x' + op.hexData()))),
    ]] as const)),
    ...Object.fromEntries([...Array(16).keys()].map(pos => [`DUP${(pos + 1 as Size<16>)}`, [0x80 + pos,
        0,
    (s: LocalState) => s.stack.dup(pos),
    ]] as const)),
    ...Object.fromEntries([...Array(16).keys()].map(pos => [`SWAP${(pos + 1 as Size<16>)}`, [0x90 + pos,
        0,
    (s: LocalState) => s.stack.swap(pos + 1),
    ]] as const)),

    // ...Object.fromEntries(([0, 1, 2, 3, 4] as const).map(topics => [`LOG${topics}`, 0xA0 + topics] as const)),

    // CREATE: 0xF0,
    // CALL: 0xF1,
    // CALLCODE: 0xF2,
    // RETURN: 0xF3,
    // DELEGATECALL: 0xF4,
    // STATICCALL: 0xFA,
    // REVERT: 0xFD,
    INVALID: [0xFE, inst(0)],
    // SELFDESTRUCT: 0xFF,
} satisfies { [m: string]: [number | {opcode: number, size: number}, (state: LocalState) => void ] };

function expr(inputs: number) {
    return function (state: LocalState, op: _Op) {
        state.addLocal(new SExpr(op.mnemonic, state.stack.popn(inputs)));
    }
}

function inst(inputs: number) {
    return function (state: LocalState, op: _Op) {
        state.stmts.push(new Inst(op.mnemonic, state.stack.popn(inputs)));
    }
}

export const [f, tbl] = table(F);

export const frontier = Opcodes.new('INVALID').build(f);

// export const constantinople = frontier.build({
//     SHL: 0x1b,
//     SHR: 0x1c,
//     SAR: 0x1d,
//     CREATE2: 0xF5,
// });

// export const Istanbul = constantinople.build({
//     CHAINID: 0x46,
//     SELFBALANCE: 0x47,
// });

// export const London = Istanbul.build({
//     BASEFEE: 0x48,
// });

// export const Paris = London.build({
//     PREVRANDAO: 0x44,
// });

// export const ShanghaiStep = Paris.build({
//     PUSH0: [0x5F, 1, 0],
// });

console.log(tbl);

export class SExpr {
    readonly op;
    readonly args;
    constructor(op: string, args: SExpr[]) {
        this.op = op;
        this.args = args;
    }
    toString() {
        return `${this.op.toLowerCase()}(${this.args.join(', ')})`;
    }
}

class Lit extends SExpr {
    readonly value;
    constructor(value: bigint) {
        super('lit', []);
        this.value = value;
    }
    override toString() {
        // return `lit(${this.value})`;
        return `${this.value}n`;
    }
}

class LocalState extends State<Inst, Local> {
    addLocal(expr: SExpr) {
        const local = new Local(this.stmts.length, expr);
        const def = new Def(local);
        this.stmts.push(def);
        this.stack.push(local);
    }
}

class Inst {
    readonly fn;
    readonly args;
    constructor(fn: string, args: SExpr[]) {
        this.fn = fn;
        this.args = args;
    }
    toString() {
        return `${this.fn.toLowerCase()}(${this.args.join(', ')});`;
    }
}

class Def extends Inst {
    readonly local;
    constructor(local: Local) {
        super('local', []);
        this.local = local;
    }
    override toString() {
        return `%${this.local.index}<^${this.local.uses},_${this.local.pops}> := ${this.local.expr};`;
    }
}

class Local extends SExpr {
    readonly index;
    readonly expr;
    uses = 1;
    pops = 0;
    static readonly kind: string = 'local';
    constructor(index: number, expr: SExpr) {
        super(Local.kind, []);
        this.index = index;
        this.expr = expr;
    }
    override toString() {
        // return `%${this.index}`;
        return `%${this.index}` + (this.singleUse ? `:${this.expr}` : '');
    }
    get singleUse(): boolean {
        return this.uses === 1;
    }
}

// TODO improve type
type _Op = Exclude<ReturnType<ReturnType<typeof frontier['decode']>['next']>['value'], void>;

export function exec(op: _Op, state: LocalState) {
    // export function exec(op: Opcodes['Opcode']['prototype'], stack: Stack<SExpr>) {
    const [, ins, outs] = tbl[op.mnemonic as keyof typeof tbl];
    // const args = [];
    // while (ins > 0) {
    //     const elem = state.stack.pop();
    //     args.push(elem);
    //     ins--;
    // }
    if (typeof outs === 'function') {
        outs(state, op as IPushOpcode<''>);
    } else if (outs) {
        state.addLocal(new SExpr(op.mnemonic, state.stack.popn(ins)));
    } else {
        state.stmts.push(new Inst(op.mnemonic, state.stack.popn(ins)));
    }
}

export function halts(mnemonic: string): boolean {
    const inst = ['STOP', 'JUMP', 'JUMPI', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT'];
    return inst.includes(mnemonic);
}

export function run(bytecode: Parameters<typeof arrayify>[0]) {

    // class StackParam extends SExpr {
    class StackParam extends Local {
        readonly name;
        override readonly index;
        static override readonly kind = 'param';
        constructor(name: string, index: number) {
            super(index, new SExpr(name, []));
            this.name = name;
            this.index = index;
        }
        override toString() {
            return this.name + `${this.op}[${this.index}]`;
        }
    }

    const PStack = class extends Stack<Local> {
        params: StackParam[] = [];

        override pop(): Local {
            if (this.values.length === 0) {
                const param = new StackParam('eparam', this.params.length);
                this.params.push(param);
                super.push(param);
            }
            this.top!.pops++;
            return super.pop();
        }

        override swap(secondPosition: number): void {
            if (secondPosition >= this.values.length) {
                const params = [...Array((secondPosition + 1) - this.values.length).keys()].map(i => new StackParam('sparam', i + this.values.length));
                this.params.push(...params);
                this.values.push(...params);
            }
            super.swap(secondPosition);
        }

        override dup(pos: number): void {
            if (pos >= this.values.length) {
                const params = [...Array((pos + 1) - this.values.length).keys()].map(i => new StackParam('dparam', i + this.values.length));
                this.params.push(...params);
                this.values.push(...params);
            }

            super.dup(pos);
            this.top!.uses++;
        }
    };

    let prevop = undefined;
    const bbs = [];
    const buf = arrayify(bytecode);
    let insts = [];
    let state = new LocalState(new PStack());
    // let state = new PStack();
    for (const op of frontier.decode(buf)) {
        if (op.mnemonic === 'JUMP' || op.mnemonic === 'JUMPI') {
            if (prevop?.data === undefined) {
                console.log('dynamic jump', `${op}`);
            }
        }
        prevop = op;

        exec(op, state);
        console.log(`${op} |= ${state.stack}`);
        insts.push(op);

        if (halts(op.mnemonic) || buf[op.nextpc] === frontier.opcodes.JUMPDEST) {
            console.log('--- bb ---')
            bbs.push({ insts, state, pc: insts[0].pc });
            insts = [];
            // state = new PStack();
            state = new LocalState(new PStack());
        }
    }
    // bbs.forEach(bb => console.log('bb', bb.state, bb.insts.map(op => `${op}`)));
    bbs.forEach(bb => {
        console.log('bb @', bb.pc, bb.state.stack.params);
        for (const x of bb.state.stmts) {
            // if (x instanceof Def && x.local.uses === 1) continue;
            console.log(`  ${x}`);

            // console.log('%' + x.index, ':=', `${x.expr}`);
        }
    });
}