import type { CallDataLoad, CallDataSize, CallValue } from './info';
import type { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './logic';
import type { Add, Div, Exp, Mod, Mul, Sub } from './math';
import type { DataCopy, Symbol0, Symbol1 } from './sym';

// type Lift<T> = T extends { e: infer TT } ? TT : never;
// type EM<T> = { tag: 'Val'; v: number } | { tag: 'Add'; l: Lift<T>; rhs: Lift<T> };
// type EM0<T> = { tag: 'Mul'; val: Lift<T>; shift: Lift<T> };
// type Rest<N> = N extends 'a' | 'b' ? never : { n: N };
// function f<
//     N extends string,
//     T extends
//         | { n: 'a'; a: string }
//         | { n: 'b'; a: string }
//         | (N extends 'a' | 'b' ? never : { n: N })
// >(t: T) {
//     // function f<N , T extends {n:'a', a:string} | {n:'b',a:string} | N extends 'a' ? never : {n: 'c' } >(t: T) {
//     if (t.n === 'a') {
//         return t.a;
//     }
//     //
// }
// f({ n: 'c' as string } as const);
// // ^?

// function asd<T extends { e: EM<T> }>(s: Stack<T['e']>) {
//     const a = s.pop();
//     if (a.tag === 'Add' && a.l.tag === 'Val') {
//         return a.l.v;
//     }
// }

// const s0 = new Stack<EEE>();
// const r = { tag: 'Val' as const, v: 1 };
// s0.push(r);
// asd(s0);

// type EE = { e: EM<EE> | EM0<EE> };
// //   ^?
// type EEE = EE['e'];

// const x: EEE = { tag: 'Val', v: 1 };
// const y: EEE = { tag: 'Mul', val: x, shift: x };
// //    ^?
// const z: EEE = { tag: 'Add', l: { v: 1 }, rhs: { tag: 'Add', l: { v: 1 }, rhs: { v: 1 } } } as EEE;
// //    ^?
// if (z.tag === 'Add') {
//     // z.
// }

// const w = new Stack<EEE>();
// w.push(z);
// asd(w);

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
    | DataCopy;

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
