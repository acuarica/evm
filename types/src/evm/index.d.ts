import { decode } from '../opcode';
import { State as TState } from '../state';
import { type Metadata } from '../metadata';
import type { Expr, Inst } from './expr';
import { Invalid } from './system';
import { type IEvents } from './log';
import { type IStore } from './storage';
import { Branch, type ISelectorBranches } from './flow';
type State = TState<Inst, Expr>;
export declare class EVM implements IEvents, IStore, ISelectorBranches {
    /**
     * The `metadataHash` part from the `bytecode`.
     * That is, if present, the `bytecode` without its `code`.
     */
    readonly metadata?: Metadata | undefined;
    /**
     *
     */
    private readonly insts;
    /**
     *
     */
    readonly chunks: Map<number, {
        pcend: number;
        states: State[];
    }>;
    /**
     *
     */
    readonly errors: Invalid[];
    readonly events: IEvents['events'];
    readonly variables: IStore['variables'];
    readonly mappings: IStore['mappings'];
    readonly functionBranches: ISelectorBranches['functionBranches'];
    /**
     * The `Opcode[]` decoded from `bytecode`.
     */
    readonly opcodes: ReturnType<typeof decode>['opcodes'];
    /**
     * Jump destination (`JUMPDEST`) offsets found in `bytecode`.
     * This is used to speed up offset search.
     */
    readonly jumpdests: ReturnType<typeof decode>['jumpdests'];
    private constructor();
    /**
     *
     * @param bytecode
     * @returns
     */
    static from(bytecode: string): EVM;
    /**
     *
     */
    start(): void;
    run(pc0: number, state: State): void;
    exec(pc0: number, state: State): void;
}
export declare function gc(b: Branch, chunks: EVM['chunks']): State | undefined;
export {};
