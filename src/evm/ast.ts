import type { Add, Div, Exp, Mod, Mul, Sub } from './math';
import type { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './logic';
import type { CallDataLoad, CallDataSize, CallValue } from './env';
import type { DataCopy, Symbol0, Symbol1 } from './sym';
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
    | CallDataSize
    | Symbol0
    | Symbol1
    | DataCopy
    | MLoad
    | Sha3
    | Create
    | Call
    | ReturnData
    | CallCode
    | Create2
    | StaticCall
    | DelegateCall;

/**
 * Base definition for any type that is `Stmt`.
 */
export interface IStmt {
    /**
     * The `name` tag of this `IStmt`.
     */
    readonly name: string;

    next?(): Branch[];
}

/**
 *
 */
export type Stmt =
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
    | SigCase;

export function Tag<N extends string>(tag: N, prec: number = Val.prec) {
    abstract class Tag {
        readonly tag: N = tag;

        static readonly prec = prec;

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
        abstract str(): string;

        _str(prec: any): string {
            const text = this.str();
            return Tag.prec < prec ? `(${text})` : text;
        }

        toString() {
            return this.str();
        }
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

    constructor(readonly val: bigint) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `${this.isJumpDest() ? '[J]' : ''}0x${this.val.toString(16)}`;
    }
}
