import { TopLevelFunction } from './inst/jumps';
import { Expr } from './ast';

export class Contract {
    /**
     *
     */
    readonly mappings: {
        [key: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Expr[][];
            values: Expr[];
        };
    } = {};

    /**
     *
     */
    readonly variables: { [key: string]: Variable } = {};

    /**
     *
     */
    readonly functions: { [hash: string]: TopLevelFunction } = {};

    /**
     *
     */
    readonly events: { [topic: string]: { label?: string; indexedCount: number } } = {};

    /**
     *
     * @param functionHashes
     * @param eventHashes
     */
    constructor(
        /**
         *
         */
        readonly functionHashes: { [hash: string]: string },
        /**
         *
         */
        readonly eventHashes: { [hash: string]: string }
    ) {}
}

export class Variable {
    constructor(public label: string | undefined, readonly types: any[]) {}
}
