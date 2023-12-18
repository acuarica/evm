import type { State } from '../state';
import type { Opcode } from '../opcode';
import type { Type } from '../type';
import type { Add, Div, Exp, Mod, Mul, Sub } from './math';
import type { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './logic';
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
import type { Branch, Jump, JumpDest, Jumpi, SigCase } from './flow';
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

    constructor(
        readonly reason: string,
        readonly opcode: Opcode,
        readonly state: State<Inst, Expr>
    ) {}

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
        readonly falseBlock?: Stmt[]
    ) {}
    eval() {
        return this;
    }
}

export class CallSite {
    readonly name = 'CallSite';
    constructor(readonly selector: string) {}
    eval() {
        return this;
    }
}

export class Require {
    readonly name = 'Require';
    constructor(readonly condition: Expr, readonly args: Expr[]) {}
    eval() {
        return this;
    }
}

export abstract class Tag {
    abstract readonly tag: string;

    type?: Type;

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
}

export abstract class Bin extends Tag {
    constructor(readonly left: Expr, readonly right: Expr) {
        super();
    }
}

export class Val extends Tag {
    readonly tag = 'Val';

    jumpDest: number | null = null;

    constructor(readonly val: bigint, readonly isPush = false) {
        super();
    }

    override eval(): Expr {
        return this;
    }
}

export class Local extends Tag {
    readonly tag = 'Local';

    nrefs = 0;

    constructor(readonly index: number, readonly value: Expr) {
        super();
    }

    override eval(): Expr {
        return this.value.eval();
    }
}

export class Locali implements IInst {
    readonly name = 'Local';

    constructor(readonly local: Local) {}

    eval() {
        return this;
    }
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

export * from './flow';
export * from './log';
export * from './logic';
export * from './math';
export * from './memory';
export * from './special';
export * from './storage';
export * from './system';
