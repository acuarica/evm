import type { Add, Div, Exp, Mod, Mul, Sub } from './math';
import type { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './logic';
import type { CallDataLoad, CallDataSize, CallValue } from './info';
import type { DataCopy, Symbol0, Symbol1 } from './sym';
import type { MLoad, MStore } from './memory';

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
    | MLoad;

/**
 *
 */
export type Stmt = MStore;

export function Tag<N extends string>(tag: N, prec: number) {
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
        return `${this.isJumpDest() ? '[J]' : ''}${this.val.toString(16)}`;
    }
}
