import type { Ram } from '../state';
import { type Expr, Val } from './expr';
export declare const INFO: {
    readonly ADDRESS: "this";
    readonly ORIGIN: "tx.origin";
    readonly CALLER: "msg.sender";
    readonly CODESIZE: "this.code.length";
    readonly GASPRICE: "tx.gasprice";
    readonly RETURNDATASIZE: "output.length";
    readonly COINBASE: "block.coinbase";
    readonly TIMESTAMP: "block.timestamp";
    readonly NUMBER: "block.number";
    readonly DIFFICULTY: "block.difficulty";
    readonly GASLIMIT: "block.gaslimit";
    readonly CHAINID: "chainid";
    readonly SELFBALANCE: "self.balance";
    readonly MSIZE: "memory.length";
    readonly GAS: "gasleft()";
};
export type Info = (typeof INFO)[keyof typeof INFO];
declare const Symbol0_base: (abstract new () => {
    readonly tag: "Symbol0";
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
export declare class Symbol0 extends Symbol0_base {
    readonly symbol: Info;
    readonly type2?: string | undefined;
    constructor(symbol: Info, type2?: string | undefined);
    eval(): Expr;
    str(): string;
}
declare const Symbol1_base: (abstract new () => {
    readonly tag: "Symbol1";
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
export declare class Symbol1 extends Symbol1_base {
    readonly fn: (value: string) => string;
    readonly value: Expr;
    constructor(fn: (value: string) => string, value: Expr);
    eval(): Expr;
    str(): string;
}
declare const DataCopy_base: (abstract new () => {
    readonly tag: "DataCopy";
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
export declare class DataCopy extends DataCopy_base {
    readonly fn: (offset: string, size: string) => string;
    readonly offset: Expr;
    readonly size: Expr;
    constructor(fn: (offset: string, size: string) => string, offset: Expr, size: Expr);
    eval(): this;
    str(): string;
}
export declare const SYM: {
    BALANCE: ({ stack }: Ram<Expr>) => void;
    CALLDATACOPY: ({ stack, memory }: Ram<Expr>) => void;
    CODECOPY: ({ stack, memory }: Ram<Expr>) => void;
    EXTCODESIZE: ({ stack }: Ram<Expr>) => void;
    EXTCODECOPY: ({ stack }: Ram<Expr>) => void;
    RETURNDATACOPY: ({ stack, memory }: Ram<Expr>) => void;
    EXTCODEHASH: ({ stack }: Ram<Expr>) => void;
    BLOCKHASH: ({ stack }: Ram<Expr>) => void;
    ADDRESS: ({ stack }: Ram<Expr>) => void;
    ORIGIN: ({ stack }: Ram<Expr>) => void;
    CALLER: ({ stack }: Ram<Expr>) => void;
    CODESIZE: ({ stack }: Ram<Expr>) => void;
    GASPRICE: ({ stack }: Ram<Expr>) => void;
    RETURNDATASIZE: ({ stack }: Ram<Expr>) => void;
    COINBASE: ({ stack }: Ram<Expr>) => void;
    TIMESTAMP: ({ stack }: Ram<Expr>) => void;
    NUMBER: ({ stack }: Ram<Expr>) => void;
    DIFFICULTY: ({ stack }: Ram<Expr>) => void;
    GASLIMIT: ({ stack }: Ram<Expr>) => void;
    CHAINID: ({ stack }: Ram<Expr>) => void;
    SELFBALANCE: ({ stack }: Ram<Expr>) => void;
    MSIZE: ({ stack }: Ram<Expr>) => void;
    GAS: ({ stack }: Ram<Expr>) => void;
};
export declare function datacopy(fn: (offset: string, size: string) => string): ({ stack, memory }: Ram<Expr>) => void;
export {};
