import { arrayify } from './bytes.ts';
import { type Metadata, parseMetadata } from './metadata.ts';
import { type Block, Sevm } from './sevm.ts';
import { Shanghai } from './forks.ts';
// import { buildAST } from './ast.ts';
// import { yul } from './yul.ts';
import { Selectors } from './selectors.ts';

// export function x(bytecode: Uint8Array) {
//     return sevm(bytecode, 0, undefined as unknown as State, new Frontier());
// }

export class Contract {

    /**
     * The `bytecode` used to create this `Contract`.
     */
    readonly bytecode: Uint8Array;

    /**
     * The `metadata` part of this `Contract`.
     */
    readonly metadata: Metadata | undefined;

    readonly states: Map<number, Block[]>;

    /**
     *
     * @param bytecode the Contract's bytecode to analyze.
     */
    constructor(bytecode: Parameters<typeof arrayify>[0]) {
        this.bytecode = arrayify(bytecode);
        this.metadata = parseMetadata(this.bytecode).metadata;
        this.states = new Sevm(new (Selectors(Shanghai))(), this.bytecode).run();

        // const K = Selectors(Shanghai);
        // const s = new K();
        // s.decode()
        // s.publicBranches
    }

    /**
     * https://docs.soliditylang.org/en/latest/yul.html
     */
    toYul(_name: string = 'runtime'): string {
        throw 'todo';
        // const a = buildAST(this.ss);
        // return yul(a, name);
    }

    /**
     * 
     */
    toSolidity(): string {
        throw 'todo';
    }
}