import { arrayify } from './bytes.ts';
import { type Metadata, parseMetadata } from './metadata.ts';
import { type State, Sevm } from './sevm.ts';
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

    readonly step;

    readonly states: Map<number, State[]>;

    /**
     *
     * @param bytecode the Contract's bytecode to analyze.
     */
    constructor(bytecode: Parameters<typeof arrayify>[0], Step = Selectors(Shanghai)) {
        this.bytecode = arrayify(bytecode);
        this.metadata = parseMetadata(this.bytecode).metadata;
        this.step = new Step();
        this.states = new Sevm(this.step, this.bytecode).run();
    }


    /**
     * 
     */
    chunks(): {
        /**
         * Where this `chunk` begins, inclusive.
         */
        pcbegin: number;
        /**
         * Where this `chunk` ends, exclusive.
         */
        pcend: number;
        /**
         * The content found for this `chunk`.
         * If `pcbegin` is reacheable, then `content` is the `Opcode` for this block. 
         * Otherwise the uninterpreted slice of the bytecode for this chunk.
         */
        content: State[] | Uint8Array,
    }[] {
        let lastpc = 0;

        const result: ReturnType<Contract['chunks']> = [];
        for (const pc of [...this.states.keys()].sort((l, r) => l - r)) {
            const states = this.states.get(pc)!;
            if (lastpc !== pc) {
                result.push({ pcbegin: lastpc, pcend: pc, content: this.bytecode.subarray(lastpc, pc) });
            }
            lastpc = states[0].pcend!;
            // const opcodes = block.opcodes.map(({ opcode, }) => opcode);
            result.push({ pcbegin: pc, pcend: states[0].pcend!, content: states });
        }

        if (lastpc !== this.bytecode.length) {
            result.push({ pcbegin: lastpc, pcend: this.bytecode.length, content: this.bytecode.subarray(lastpc) });
        }

        return result;
    }

    /**
     * 
     */
    get selectors(): string[] {
        return [...this.step.publicBranches.keys()];
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