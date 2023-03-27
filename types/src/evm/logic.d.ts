import type { Stack } from '../state';
import { type Expr, Val } from './expr';
declare const Lt_base: (abstract new (left: Expr, right: Expr, equal?: boolean) => {
    readonly left: Expr;
    readonly right: Expr;
    readonly equal: boolean;
    str(): string;
    readonly tag: "Lt";
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
export declare class Lt extends Lt_base {
    eval(): Expr;
}
declare const Gt_base: (abstract new (left: Expr, right: Expr, equal?: boolean) => {
    readonly left: Expr;
    readonly right: Expr;
    readonly equal: boolean;
    str(): string;
    readonly tag: "Gt";
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
export declare class Gt extends Gt_base {
    eval(): Expr;
}
declare const Eq_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Eq";
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
export declare class Eq extends Eq_base {
    eval(): Expr;
}
declare const IsZero_base: (abstract new () => {
    readonly tag: "IsZero";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class IsZero extends IsZero_base {
    readonly value: Expr;
    constructor(value: Expr);
    eval(): Expr;
    str(): string;
}
declare const And_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "And";
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
export declare class And extends And_base {
    eval(): Expr;
}
declare const Or_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Or";
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
export declare class Or extends Or_base {
    eval(): Expr;
}
declare const Xor_base: (abstract new (left: Expr, right: Expr) => {
    readonly left: Expr;
    readonly right: Expr;
    str(): string;
    readonly tag: "Xor";
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
export declare class Xor extends Xor_base {
    eval(): Expr;
}
declare const Not_base: (abstract new (value: Expr) => {
    readonly value: Expr;
    str(): string;
    readonly tag: "Not";
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
export declare class Not extends Not_base {
    eval(): Expr;
}
declare const Byte_base: (abstract new () => {
    readonly tag: "Byte";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Byte extends Byte_base {
    readonly pos: Expr;
    readonly data: Expr;
    constructor(pos: Expr, data: Expr);
    eval(): Expr;
    str(): string;
}
declare const Shl_base: (abstract new (value: Expr, shift: Expr) => {
    readonly value: Expr;
    readonly shift: Expr;
    str(): string;
    readonly tag: "Shl";
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
export declare class Shl extends Shl_base {
    eval(): Expr;
}
declare const Shr_base: (abstract new (value: Expr, shift: Expr) => {
    readonly value: Expr;
    readonly shift: Expr;
    str(): string;
    readonly tag: "Shr";
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
export declare class Shr extends Shr_base {
    eval(): Expr;
}
declare const Sar_base: (abstract new (value: Expr, shift: Expr) => {
    readonly value: Expr;
    readonly shift: Expr;
    str(): string;
    readonly tag: "Sar";
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
export declare class Sar extends Sar_base {
    eval(): Expr;
}
declare const Sig_base: (abstract new () => {
    readonly tag: "Sig";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Sig extends Sig_base {
    readonly selector: string;
    constructor(selector: string);
    eval(): Expr;
    str(): string;
}
export declare const LOGIC: {
    LT: (stack: Stack<Expr>) => void;
    GT: (stack: Stack<Expr>) => void;
    SLT: (stack: Stack<Expr>) => void;
    SGT: (stack: Stack<Expr>) => void;
    EQ: (stack: Stack<Expr>) => void;
    ISZERO: (stack: Stack<Expr>) => void;
    AND: (stack: Stack<Expr>) => void;
    OR: (stack: Stack<Expr>) => void;
    XOR: (stack: Stack<Expr>) => void;
    NOT: (stack: Stack<Expr>) => void;
    BYTE: (stack: Stack<Expr>) => void;
    SHL: (stack: Stack<Expr>) => void;
    SHR: (stack: Stack<Expr>) => void;
    SAR: (stack: Stack<Expr>) => void;
};
export declare function shift(Cons: new (value: Expr, shift: Expr) => Expr): (stack: Stack<Expr>) => void;
export {};
