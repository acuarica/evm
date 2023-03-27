import type { Stack } from '../state';
import { type Expr } from './expr';
declare const CallValue_base: (abstract new () => {
    readonly tag: "CallValue";
    readonly type?: string;
    isVal(): this is import("./expr").Val;
    isZero(): this is import("./expr").Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class CallValue extends CallValue_base {
    eval(): Expr;
    str(): string;
}
declare const CallDataLoad_base: (abstract new () => {
    readonly tag: "CallDataLoad";
    readonly type?: string;
    isVal(): this is import("./expr").Val;
    isZero(): this is import("./expr").Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class CallDataLoad extends CallDataLoad_base {
    location: Expr;
    constructor(location: Expr);
    eval(): Expr;
    str(): string;
}
declare const CallDataSize_base: (abstract new () => {
    readonly tag: "CallDataSize";
    readonly type?: string;
    isVal(): this is import("./expr").Val;
    isZero(): this is import("./expr").Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class CallDataSize extends CallDataSize_base {
    eval(): Expr;
    str(): string;
}
export declare const ENV: {
    /**
     * Get deposited value by the instruction/transaction responsible for this execution.
     *
     * @param stack
     */
    CALLVALUE: (stack: Stack<Expr>) => void;
    CALLDATALOAD: (stack: Stack<Expr>) => void;
    CALLDATASIZE: (stack: Stack<Expr>) => void;
};
export {};
