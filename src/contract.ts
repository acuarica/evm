import { arrayify } from './bytes.ts';
import { type Metadata, parseMetadata } from './metadata.ts';
import { run } from './sevm.ts';
import { buildAST } from './ast.ts';
import { yul } from './yul.ts';

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
     * https://docs.soliditylang.org/en/latest/yul.html
     */
    toYul(name: string = 'runtime'): string {
        const ss = run(this.bytecode);
        const a = buildAST(ss);
        return yul(a, name);
    }

    /**
     * 
     */
    toSolidity(): string {
        throw 'todo';
    }
}