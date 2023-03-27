import type { Stack } from '../state';
import { type Expr, Val } from './expr';
declare const Add_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Add";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Add extends Add_base {
    eval(): Expr;
}
declare const Mul_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Mul";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Mul extends Mul_base {
    eval(): Expr;
}
declare const Sub_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Sub";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Sub extends Sub_base {
    eval(): Expr;
}
declare const Div_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Div";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Div extends Div_base {
    eval(): Expr;
}
declare const Mod_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Mod";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Mod extends Mod_base {
    eval(): Expr;
}
declare const Exp_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Exp";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Exp extends Exp_base {
    eval(): Expr;
}
export declare const MATH: {
    ADD: (stack: Stack<Expr>) => void;
    MUL: (stack: Stack<Expr>) => void;
    SUB: (stack: Stack<Expr>) => void;
    DIV: (stack: Stack<Expr>) => void;
    SDIV: (stack: Stack<Expr>) => void;
    MOD: (stack: Stack<Expr>) => void;
    SMOD: (stack: Stack<Expr>) => void;
    ADDMOD: (stack: Stack<Expr>) => void;
    MULMOD: (stack: Stack<Expr>) => void;
    EXP: (stack: Stack<Expr>) => void;
    SIGNEXTEND: (stack: Stack<Expr>) => void;
};
export declare function bin(Cons: new (lhs: Expr, rhs: Expr) => Expr): (stack: Stack<Expr>) => void;
export {};
