import type { State } from '../state';
import { type Expr, type IInst, type Inst } from './expr';
export interface IStore {
    /**
     * vars definition
     */
    readonly variables: {
        [location: string]: Variable;
    };
    /**
     * mappings definition
     */
    readonly mappings: {
        [location: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Expr[][];
            values: Expr[];
        };
    };
}
/**
 *
 */
export declare class Variable {
    label: string | undefined;
    readonly types: Expr[];
    constructor(label: string | undefined, types: Expr[]);
}
/**
 *
 * @param variables
 * @returns
 */
export declare function stringifyVariables(variables: IStore['variables']): string;
/**
 *
 * @param mappings
 * @returns
 */
export declare function stringifyStructs(mappings: IStore['mappings']): string;
/**
 *
 * @param mappings
 * @returns
 */
export declare function stringifyMappings(mappings: IStore['mappings']): string;
export declare class MappingStore implements IInst {
    readonly mappings: IStore['mappings'];
    readonly location: number;
    readonly items: Expr[];
    readonly data: Expr;
    readonly structlocation?: bigint | undefined;
    readonly name = "MappingStore";
    constructor(mappings: IStore['mappings'], location: number, items: Expr[], data: Expr, structlocation?: bigint | undefined);
    eval(): this;
    toString(): string;
}
export declare class SStore {
    readonly location: Expr;
    readonly data: Expr;
    readonly variables: IStore['variables'];
    readonly name = "SStore";
    constructor(location: Expr, data: Expr, variables: IStore['variables']);
    eval(): SStore;
    toString(): string;
}
declare const MappingLoad_base: (abstract new () => {
    readonly tag: "MappingLoad";
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
export declare class MappingLoad extends MappingLoad_base {
    readonly mappings: IStore['mappings'];
    readonly location: number;
    readonly items: Expr[];
    readonly structlocation?: bigint | undefined;
    constructor(mappings: IStore['mappings'], location: number, items: Expr[], structlocation?: bigint | undefined);
    eval(): this;
    str(): string;
}
declare const SLoad_base: (abstract new () => {
    readonly tag: "SLoad";
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
export declare class SLoad extends SLoad_base {
    readonly location: Expr;
    readonly variables: IStore['variables'];
    constructor(location: Expr, variables: IStore['variables']);
    eval(): Expr;
    str(): string;
}
export declare const STORAGE: ({ variables, mappings }: IStore) => {
    SLOAD: ({ stack }: State<Inst, Expr>) => void;
    SSTORE: ({ stack, stmts }: State<Inst, Expr>) => void;
};
export {};
