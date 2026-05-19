import { mapValues, range, zip } from './lib/object.ts';
import { bigintify } from './bytes.ts';
import { Dispatch, type Opcode } from './decode.ts';
import { Inst, Local, Lit, SExpr, Def } from './sexpr.ts';
import type { State, StepFn, Step } from './sevm.ts';

const sexpr = (inputs: number) => function (this: IAddLocal, state: State, op: Opcode) {
    return this.addLocal(state, new SExpr(op.mnemonic.toLowerCase(), state.stack.popn(inputs)), op.pc);
}

const sinst = (inputs: number) => function (state: State, op: Opcode) {
    return new Inst(op.mnemonic.toLowerCase(), state.stack.popn(inputs), op.pc);
}

interface IAddLocal {
    addLocal(state: State, expr: SExpr, pc: number): Inst;
}

function ForkFactory<M extends string>(
    def: { [m in M]: { op: number, size?: number, step: StepFn } },
    invalid: NoInfer<M>,
): new () => Dispatch<M> & Step<M> {
    class Fork extends Dispatch<M> implements IAddLocal {
        readonly #locals = new WeakMap<State, number>();

        constructor() {
            super(def, invalid);
        }

        addLocal(state: State, expr: SExpr, pc: number) {
            const id = this.#locals.get(state) ?? 0;
            this.#locals.set(state, id + 1);

            const local = new Local(state.pcbegin, id, expr);
            state.stack.push(local);
            // state.insts.push(new Def(local, pc));
            return new Def(local, pc);
        }
    }
    Object.assign(Fork.prototype, mapValues(def, op => op.step));
    return Fork as (new () => Dispatch<M> & Step<M>);
}

const FlowDef = {
    POP: { op: 0x50, step: sinst(1) },
    JUMP: { op: 0x56, step: sinst(1) },
    JUMPI: { op: 0x57, step: sinst(2) },
    JUMPDEST: { op: 0x5B, step: sinst(0) },
    ...zip(range(32).map(i => [
        `PUSH${i + 1 as Size<32>}`,
        {
            op: 0x60 + i, size: i + 1, step: function (this: IAddLocal, state, op) {
                return this.addLocal(state, new Lit(bigintify(op.data!)), op.pc);
            }
        }
    ] as const)),
    ...zip(range(16).map(i => [
        `DUP${i + 1 as Size<16>}`,
        { op: 0x80 + i, step: ({ stack }, op) => (stack.dup(i), new Inst(`dup[${i + 1}]`, [], op.pc)) }
    ] as const)),
    ...zip(range(16).map(i => [
        `SWAP${i + 1 as Size<16>}`,
        { op: 0x90 + i, step: ({ stack }, op) => (stack.swap(i + 1), new Inst(`swap[${i + 1}]`, [], op.pc)) }
    ] as const)),
    INVALID: { op: 0xfe, step: sinst(0) },
} satisfies Parameters<typeof ForkFactory>[0];

const FrontierDef = {
    ...FlowDef,
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
    RETURN: { op: 0xF3, step: sinst(2) },
    DELEGATECALL: { op: 0xF4, step: sexpr(6) },
    STATICCALL: { op: 0xFA, step: sexpr(6) },
    REVERT: { op: 0xFD, step: sinst(2) },
    SELFDESTRUCT: { op: 0xFF, step: sinst(1) },
} satisfies Parameters<typeof ForkFactory>[0];

const ConstantinopleDef = {
    ...FrontierDef,
    SHL: { op: 0x1b, step: sexpr(2) },
    SHR: { op: 0x1c, step: sexpr(2) },
    SAR: { op: 0x1d, step: sexpr(2) },
    CREATE2: { op: 0xF5, step: sexpr(3) },
} satisfies Parameters<typeof ForkFactory>[0];

const IstanbulDef = {
    ...ConstantinopleDef,
    CHAINID: { op: 0x46, step: sexpr(0) },
    SELFBALANCE: { op: 0x47, step: sexpr(0) },
} satisfies Parameters<typeof ForkFactory>[0];

const LondonDef = {
    ...IstanbulDef,
    BASEFEE: { op: 0x48, step: sexpr(0) },
} satisfies Parameters<typeof ForkFactory>[0];

const ParisDef = {
    ...LondonDef,
    PREVRANDAO: { op: 0x44, step: sexpr(0) },
} satisfies Parameters<typeof ForkFactory>[0];

const ShanghaiDef = {
    ...ParisDef,
    PUSH0: {
        op: 0x5F, step: function (this: IAddLocal, state, op) {
            return this.addLocal(state, new Lit(0n), op.pc);
        }
    },
} satisfies Parameters<typeof ForkFactory>[0];

export const Flow = ForkFactory(FlowDef, 'INVALID');
export const Frontier = ForkFactory(FrontierDef, 'INVALID');
export const Constantinople = ForkFactory(ConstantinopleDef, 'INVALID');
export const Istanbul = ForkFactory(IstanbulDef, 'INVALID');
export const London = ForkFactory(LondonDef, 'INVALID');
export const Paris = ForkFactory(ParisDef, 'INVALID');
export const Shanghai = ForkFactory(ShanghaiDef, 'INVALID');