import type { Add, Div, Exp, Mod, Mul, Sub } from './math';
import type { And, Byte, Eq, Gt, IsZero, Lt, Not, Or, Sar, Shl, Shr, Sig, Xor } from './logic';
import type { CallDataLoad, CallDataSize, CallValue } from './env';
import type { DataCopy, Symbol0, Symbol1 } from './sym';
import type { MLoad, MStore } from './memory';
import type { Call, CallCode, Create, Create2, DelegateCall, Invalid, Return, ReturnData, Revert, SelfDestruct, Sha3, StaticCall, Stop } from './system';
import type { Log } from './log';
import type { Branch, Jump, JumpDest, Jumpi, SigCase } from './flow';
import type { MappingLoad, MappingStore, SLoad, SStore } from './storage';
/**
 *
 */
export type Expr = Val | Add | Mul | Sub | Div | Mod | Exp | Lt | Gt | Eq | IsZero | And | Or | Xor | Not | Byte | Shl | Shr | Sar | Sig | CallValue | CallDataLoad | CallDataSize | Symbol0 | Symbol1 | DataCopy | MLoad | Sha3 | Create | Call | ReturnData | CallCode | Create2 | StaticCall | DelegateCall | SLoad | MappingLoad;
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
export type Inst = MStore | Stop | Return | Revert | SelfDestruct | Invalid | Log | Jump | Jumpi | JumpDest | SigCase | SStore | MappingStore;
export declare function Tag<N extends string>(tag: N, prec?: number): (abstract new () => {
    readonly tag: N;
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    /**
     * hghghg
     */
    eval(): Expr;
    /**
     *
     */
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare function Bin<N extends string>(tag: N, op: string, prec: number): (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: N;
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    /**
     * hghghg
     */
    eval(): Expr;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
declare const Val_base: (abstract new () => {
    readonly tag: "Val";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    /**
     * hghghg
     */
    eval(): Expr;
    /**
     *
     */
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Val extends Val_base {
    readonly val: bigint;
    readonly isPush: boolean;
    jumpDest: number | null;
    constructor(val: bigint, isPush?: boolean);
    eval(): Expr;
    str(): string;
}
export {};
