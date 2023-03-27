/// <reference types="node" />
/**
 *
 */
export declare class Stack<in out T> {
    readonly values: T[];
    /**
     *
     * @param elem
     */
    push(elem: T): void | never;
    pop(): T | never;
    dup(position: number): void | never;
    swap(secondPosition: number): void | never;
    clone(): Stack<T>;
    static Error: {
        new (message: string): {
            name: string;
            message: string;
            stack?: string;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
}
/**
 * Represents the state of an EVM run with statements `S` and expressions `E`.
 */
export declare class State<S, E> {
    readonly stack: Stack<E>;
    readonly memory: {
        [location: number]: E;
    };
    /**
     * Indicates whether this `State` has been halted.
     */
    private _halted;
    /**
     * The statements executed that lead to this `State`.
     */
    readonly stmts: S[];
    /**
     *
     * @param stack
     * @param memory
     */
    constructor(stack?: Stack<E>, memory?: {
        [location: number]: E;
    });
    /**
     * Indicates whether this `State` has been halted.
     *
     * When `true`, no more execution should be allowed against this `State`.
     */
    get halted(): boolean;
    /**
     * The last statement in this `State`.
     */
    get last(): S | undefined;
    /**
     * Halts this `State`.
     * It adds `last` to `stmts` and sets `halted` to `true`.
     *
     * @param last The `S` that halts this `State`.
     */
    halt(last: S): void;
    /**
     * Creates a detached clone from this `State`.
     * The cloned state only shallow copies both `stack` and `memory`,
     * while `stmts` will be empty and `halted` false.
     *
     * Note however the shallow copy means the structure of both `stack` and `memory` are cloned,
     * not their contents.
     * This means that any expression `E` in either the `stack` or `memory`
     * will be shared across instances if they are references.
     *
     * @returns a new `State` detached from this one.
     */
    clone(): State<S, E>;
}
/**
 * Represents the volatile memory of `State`, _i.e._, its `stack` and `memory`.
 */
export type Ram<E> = Pick<State<never, E>, 'stack' | 'memory'>;
