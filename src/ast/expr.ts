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
    | MappingLoad;

export const isExpr = (expr: unknown): expr is Expr =>
    expr !== null && typeof expr === 'object' && 'tag' in expr;

export const isInst = (inst: unknown): inst is Inst =>
    inst !== null && typeof inst === 'object' && 'name' in inst;

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
    | Throw;

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

    toString() {
        return `throw('${this.reason}');`;
    }
}

export function Tag<N extends string>(tag: N, prec: number = Val.prec) {
    abstract class Tag {
        readonly tag: N = tag;

        static readonly prec = prec;

        type?: Type;

        isVal(): this is Val {
            return this.tag === 'Val';
        }

        isZero(): this is Val {
            return this.isVal() && this.val === 0n;
        }

        isJumpDest() {
            return this.isVal() && this.jumpDest !== null;
        }

        /**
         * hghghg
         */
        abstract eval(): Expr;

        /**
         *
         */
        // abstract str(): string;

        _str(_prec: number): string {
            // const text = this.str();
            // return Tag.prec < prec ? `(${text})` : text;
            return '';
        }

        // toString() {
        // return this.str();
        // }
    }

    return Tag;
}

export function Bin<N extends string>(tag: N, op: string, prec: number) {
    abstract class Bin extends Tag(tag, prec) {
        constructor(readonly left: Expr, readonly right: Expr) {
            super();
        }

        str() {
            return `${this.left._str(prec)} ${op} ${this.right._str(prec)}`;
        }
    }

    return Bin;
}

export class Val extends Tag('Val', 16) {
    jumpDest: number | null = null;

    constructor(readonly val: bigint, readonly isPush = false) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `${this.isJumpDest() ? '[J]' : ''}0x${this.val.toString(16)}`;
    }
}
