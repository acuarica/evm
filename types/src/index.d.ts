import type { Expr, Inst } from './evm/expr';
import type { Revert } from './evm/system';
import { State } from './state';
import { EVM } from './evm';
/**
 *
 */
export declare class Contract {
    /**
     *
     */
    readonly evm: EVM;
    /**
     *
     */
    readonly main: Stmt[];
    /**
     *
     */
    readonly functions: {
        [selector: string]: PublicFunction;
    };
    constructor(bytecode: string);
    get metadata(): EVM['metadata'];
    /**
     *
     * @returns
     */
    getFunctions(): string[];
    /**
     * https://eips.ethereum.org/EIPS/eip-165
     *
     * @returns
     */
    isERC165(): boolean;
    /**
     *
     * @returns
     */
    decompile(): string;
    /**
     * Migrated from old codebase.
     * Evaluate if it makes sense to keep it.
     *
     * @param opcode
     * @returns
     */
    containsOpcode(opcode: number | string): boolean;
}
export declare class If {
    readonly condition: Expr;
    readonly trueBlock?: Stmt[] | undefined;
    readonly falseBlock?: Stmt[] | undefined;
    readonly name = "If";
    constructor(condition: Expr, trueBlock?: Stmt[] | undefined, falseBlock?: Stmt[] | undefined);
    toString(): string;
}
export declare class CallSite {
    readonly selector: string;
    readonly name = "CallSite";
    constructor(selector: string);
    toString(): string;
}
export declare function isRevertBlock(falseBlock: Stmt[]): falseBlock is [Revert];
export declare class Require {
    readonly condition: Expr;
    readonly args: Expr[];
    readonly name = "Require";
    constructor(condition: Expr, args: Expr[]);
    toString(): string;
}
export declare class PublicFunction {
    readonly stmts: Stmt[];
    readonly selector: string;
    /**
     *
     */
    label: string | undefined;
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly returns: [];
    constructor(stmts: Stmt[], selector: string);
}
export type Stmt = Inst | If | CallSite | Require;
export declare function build(state: State<Inst, Expr>): Stmt[];
/**
 *
 * @param stmts
 * @param indentation
 * @returns
 */
export declare function stringify(stmts: Stmt[], indentation?: number): string;
