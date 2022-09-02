import { TopLevelFunction, Variable } from './inst/jumps';
import { Operand } from './state';

export class Contract {
    /**
     *
     */
    readonly mappings: {
        [key: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Operand[][];
            values: Operand[];
        };
    } = {};

    /**
     *
     */
    readonly functions: { [hash: string]: TopLevelFunction } = {};

    /**
     *
     */
    readonly variables: { [key: string]: Variable } = {};

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
