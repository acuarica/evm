import { arrayify } from './bytes.ts';
import { Metadata, parseMetadata } from './metadata.ts';

export class Contract {

    /**
     * The `bytecode` used to create this `Contract`.
     */
    readonly bytecode: Uint8Array;

    /**
     * The `metadata` part of this `Contract`.
     */
    readonly metadata: Metadata | undefined;

    /**
     *
     * @param bytecode the Contract's bytecode to analyze.
     */
    constructor(bytecode: Parameters<typeof arrayify>[0]) {
        this.bytecode = arrayify(bytecode);
        this.metadata = parseMetadata(this.bytecode).metadata;
    }

    /**
     * 
     */
    toYul(): string {
        throw 'todo';
    }

    /**
     * 
     */
    toSolidity(): string {
        throw 'todo';
    }
}