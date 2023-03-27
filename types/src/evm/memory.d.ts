import type { State } from '../state';
import { type Inst, type Expr, type IInst } from './expr';
declare const MLoad_base: (abstract new () => {
    readonly tag: "MLoad";
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
export declare class MLoad extends MLoad_base {
    readonly loc: Expr;
    /**
     * Loads word from memory.
     *
     * @param loc
     */
    constructor(loc: Expr);
    eval(): this;
    str(): string;
}
export declare class MStore implements IInst {
    readonly location: Expr;
    readonly data: Expr;
    readonly name = "MStore";
    constructor(location: Expr, data: Expr);
    eval(): this;
    toString(): string;
}
export declare const MEMORY: {
    MLOAD: ({ stack, memory }: State<Inst, Expr>) => void;
    MSTORE: typeof mstore;
    MSTORE8: typeof mstore;
};
declare function mstore({ stack, memory, stmts }: State<Inst, Expr>): void;
export {};
