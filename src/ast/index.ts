import type { Opcode } from '../step';
import type { Type } from '../abi';
import type { Add, Div, Exp, Mod, Mul, Sub } from './alu';
import type { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Xor } from './alu';
import type { DataCopy, Prop, CallDataLoad, CallValue, Fn } from './special';
import type { MLoad, MStore } from './memory';
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
} from './system';
import type { Log } from './log';
import type { Branch, Jump, JumpDest, Jumpi, Sig, SigCase } from './flow';
import type { MappingLoad, MappingStore, SLoad, SStore } from './storage';

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

    constructor(readonly reason: string, readonly opcode: Opcode<string>) { }

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
    constructor(
        readonly condition: Expr,
        readonly trueBlock?: Stmt[],
        readonly falseBlock?: Stmt[],
    ) { }
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
    constructor(readonly selector: string) { }
    eval() {
        return this;
    }
}

export class Require {
    readonly name = 'Require';
    constructor(readonly condition: Expr, readonly selector: string | undefined, readonly args: Expr[]) { }
    eval() {
        return new Require(this.condition.eval(), this.selector, this.args.map(evalE));
    }
}

export abstract class Tag {
    abstract readonly tag: string;

    type?: Type;

    constructor(readonly depth: number, readonly count: number) { }

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

    constructor(readonly val: bigint, readonly pushStateId?: number) {
        if (val < 0 || val >= MOD_256) throw new Error(`Val is a not a valid unsigned 256-word: ${val}`);
        super(0, 1);
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

    constructor(readonly index: number, readonly value: Expr) {
        super(value.depth + 1, value.count + 1);
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

    constructor(readonly local: Local) { }

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

export * from './alu';
export * from './flow';
export * from './log';
export * from './memory';
export * from './special';
export * from './storage';
export * from './system';
