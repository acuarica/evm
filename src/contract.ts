import { arrayify } from './bytes.ts';
import { type Metadata, parseMetadata } from './metadata.ts';
import { type State, Sevm } from './sevm.ts';
import { Shanghai } from './forks.ts';
// import { buildAST } from './ast.ts';
// import { yul } from './yul.ts';
import { Selectors } from './selectors.ts';

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
        this.metadata = parseMetadata(this.bytecode);
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
        content: State[] | Uint8Array | Metadata,
    }[] {
        const result: ReturnType<Contract['chunks']> = [];
        const pchs = [...this.states.keys()].sort((l, r) => l - r);

        let lastpc = 0;
        for (const pch of pchs) {
            const states = this.states.get(pch)!;
            if (lastpc !== pch) {
                result.push({ pcbegin: lastpc, pcend: pch, content: this.bytecode.subarray(lastpc, pch) });
            }
            lastpc = states[0].pcend!;
            result.push({ pcbegin: pch, pcend: lastpc, content: states });
        }

        if (this.metadata !== undefined) {
            if (lastpc > this.metadata.offset) {
                throw 'executing metadata';
            }
            if (lastpc !== this.metadata.offset) {
                result.push({ pcbegin: lastpc, pcend: this.metadata.offset, content: this.bytecode.subarray(lastpc, this.metadata.offset) });
            }
            result.push({ pcbegin: this.metadata.offset, pcend: this.bytecode.length, content: this.metadata });
        } else if (lastpc !== this.bytecode.length) {
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