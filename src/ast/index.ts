import type { Opcode } from '../step.ts';
import type { Type } from '../abi.ts';
import type { Add, Div, Exp, Mod, Mul, Sub } from './alu.ts';
import type { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Xor } from './alu.ts';
import type { DataCopy, Prop, CallDataLoad, CallValue, Fn } from './special.ts';
import type { MLoad, MStore } from './memory.ts';
import type {
    Call,
    CallCode,
    Create,
    Create2,
    DelegateCall,
    Invalid,
    Return,
    ReturnData,
    Revert,
    SelfDestruct,
    Sha3,
    StaticCall,
    Stop,
} from './system.ts';
import type { Log } from './log.ts';
import type { Branch, Jump, JumpDest, Jumpi, Sig, SigCase } from './flow.ts';
import type { MappingLoad, MappingStore, SLoad, SStore } from './storage.ts';

/**
 *
 */
export type Expr =
    | Val
    | Add
    | Mul
    | Sub
    | Div
    | Mod
    | Exp
    | Lt
    | Gt
    | Eq
    | IsZero
    | And
    | Or
    | Xor
    | Not
    | Byte
    | Shl
    | Shr
    | Sar
    | Sig
    | CallValue
    | CallDataLoad
    | Prop
    | Fn
    | DataCopy
    | MLoad
    | Sha3
    | Create
    | Call
    | ReturnData
    | CallCode
    | Create2
    | StaticCall
    | DelegateCall
    | SLoad
    | MappingLoad
    | Local;

export const isExpr = (expr: unknown): expr is Expr =>
    expr !== null && typeof expr === 'object' && 'tag' in expr;

export const isInst = (inst: unknown): inst is Inst =>
    inst !== null && typeof inst === 'object' && 'name' in inst;

export const evalE = (expr: Expr): Expr => expr.eval();

/**
 * Base definition for any type that is `Stmt`.
 */
export interface IInst {
    /**
     * The `name` tag of this `IStmt`.
     */
    readonly name: string;

    eval(): Inst;

    next?(): Branch[];
}

/**
 *
 */
export type Inst =
    | MStore
    | Stop
    | Return
    | Revert
    | SelfDestruct
    | Invalid
    | Log
    | Jump
    | Jumpi
    | JumpDest
    | SigCase
    | SStore
    | MappingStore
    | Throw
    | Locali;

export class Throw implements IInst {
    readonly name = 'Throw';
    readonly reason: string;
    readonly opcode: Opcode<string>;

    constructor(reason: string, opcode: Opcode<string>) {
        this.reason = reason;
        this.opcode = opcode;
    }

    eval() {
        return this;
    }
}

/**
 *
 */
export type Stmt = Inst | If | CallSite | Require;

// export class Assign {
//     readonly name = 'Asign';
//     constructor(readonly i: number, readonly phi: Phi) {}
//     eval() {
//         return this;
//     }
//     toString() {
//         return `local${this.i} = ${this.phi.toString()};`;
//     }
// }

export class If {
    readonly name = 'If';

    readonly condition: Expr;
    readonly trueBlock?: Stmt[] | undefined;
    readonly falseBlock?: Stmt[] | undefined;

    constructor(
        condition: Expr,
        trueBlock?: Stmt[],
        falseBlock?: Stmt[],
    ) {
        this.condition = condition;
        this.trueBlock = trueBlock;
        this.falseBlock = falseBlock;
    }
    eval() {
        return new If(
            this.condition.eval(),
            this.trueBlock ? reduce(this.trueBlock) : undefined,
            this.falseBlock ? reduce(this.falseBlock) : undefined,
        );
    }
}

export class CallSite {
    readonly name = 'CallSite';
    readonly selector: string;
    constructor(selector: string) {
        this.selector = selector;
    }
    eval() {
        return this;
    }
}

export class Require {
    readonly name = 'Require';
    readonly condition: Expr;
    readonly selector: string | undefined;
    readonly args: Expr[];
    constructor(condition: Expr, selector: string | undefined, args: Expr[]) {
        this.condition = condition;
        this.selector = selector;
        this.args = args;
    }
    eval() {
        return new Require(this.condition.eval(), this.selector, this.args.map(evalE));
    }
}

export abstract class Tag {
    abstract readonly tag: string;

    type?: Type;
    readonly depth: number;
    readonly count: number;

    constructor(depth: number, count: number) {
        this.depth = depth;
        this.count = count;
    }

    isVal(): this is Val {
        return this.tag === 'Val';
    }

    isZero(): this is Val {
        return this.isVal() && this.val === 0n;
    }

    isJumpDest(): this is Val {
        return this.isVal() && this.jumpDest !== null;
    }

    /**
     * Reduce `this` expression.
     */
    abstract eval(): Expr;

    children(): Expr[] {
        return Object.values(this).filter(value => value instanceof Tag) as Expr[];
    }

    unwrap(): Expr {
        return this as Expr;
    }

    // inline(): Expr {
    //     const copy = Object.assign(Object.create(Object.getPrototypeOf(this) as object), this) as this;
    //     for (const [key, value] of Object.entries(copy)) {
    //         if (value instanceof Tag) {
    //             (copy as { [key in keyof this]: Expr })[key] = value.inline();
    //         }
    //     }
    //     return copy as Expr;
    // }
}

export const MOD_256 = 1n << 0x100n;

export class Val extends Tag {
    readonly tag = 'Val';

    jumpDest: number | null = null;

    readonly val: bigint;
    readonly pushStateId?: number | undefined;

    constructor(val: bigint, pushStateId?: number) {
        if (val < 0 || val >= MOD_256) throw new Error(`Val is a not a valid unsigned 256-word: ${val}`);
        super(0, 1);
        this.val = val;
        this.pushStateId = pushStateId;
    }

    override eval(): Expr {
        return new Val(this.val);
    }

    // override inline(): Expr {
    //     return this;
    // }
}

export class Local extends Tag {
    readonly tag = 'Local';

    nrefs = 0;

    #memo: Expr | undefined = undefined;

    readonly index: number;
    readonly value: Expr;

    constructor(index: number, value: Expr) {
        super(value.depth + 1, value.count + 1);
        this.index = index;
        this.value = value;
    }

    override eval(): Expr {
        if (this.#memo === undefined)
            this.#memo = this.value.eval();
        return this.#memo;
    }

    override unwrap(): Expr {
        return this.value;
    }

    // override inline(): Expr {
    //     return this.value.inline();
    // }
}

export class Locali implements IInst {
    readonly name = 'Local';
    readonly local: Local;

    constructor(local: Local) {
        this.local = local;
    }

    eval() {
        return this;
    }
}

export function reduce(stmts: Stmt[]): Stmt[] {
    return stmts?.flatMap(stmt => ['Local', 'MStore'].includes(stmt.name) ? [] : stmt.eval());
}

export function inline0(stmts: Stmt[]): Stmt[] {
    const reachable = new WeakSet<Expr>();
    const result = [];
    for (const stmt of stmts.reverse()) {
        if (stmt.name === 'MStore') {
            reach(stmt.location);
            reach(stmt.data);
        } else if (stmt.name === 'Local' && reachable.has(stmt.local)) {
            continue;
        }
        result.unshift(stmt);
    }

    return result;

    function reach(expr: Expr) {
        reachable.add(expr);
        expr.children().forEach(reach);
    }
}

export function mem(stmts: Stmt[]): Stmt[] {
    // const reachable = new WeakSet<Expr>();
    const result = [];
    for (const stmt of stmts.reverse()) {
        if (stmt.name === 'MStore') {
            reach(stmt.location);
            reach(stmt.data);
            // } else if (stmt.name === 'Local' && reachable.has(stmt.local)) {
            // continue;
        }
        result.unshift(stmt);
    }

    return result;

    function reach(expr: Expr) {
        // reachable.add(expr);
        if (expr.tag === 'Local') {
            expr.nrefs--;
        }
        expr.children().forEach(reach);
    }
}

export * from './alu.ts';
export * from './flow.ts';
export * from './log.ts';
export * from './memory.ts';
export * from './special.ts';
export * from './storage.ts';
export * from './system.ts';
