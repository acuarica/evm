import type { Expr, Inst } from "./ast";

/**
 * Represents the EVM stack of expressions `E`.
 * The stack is a list of expressions `E` elements used to store smart contract instruction inputs and outputs.
 * `E` represents the type of the symbolic elements in the stack.
 *
 * There is one stack created per **call context**, and it is destroyed when the call context ends.
 * When a new value is put on the stack, it is put on top,
 * and only the top values are used by the instructions.
 * The stack currently has a maximum limit of 1024 values.
 * All instructions interact with the stack,
 * but it can be directly manipulated with instructions like `PUSH1`, `POP`, `DUP1`, or `SWAP1`.[^1]
 *
 * [^1]: https://www.evm.codes/about#stack
 */
export class Stack<in out E> {
    readonly values: E[] = [];

    /**
     * Returns the element at the top of the stack without removing it.
     */
    get top(): E | undefined {
        return this.values[0];
    }

    /**
     * Inserts the element `elem` at the top of the stack.
     *
     * @param elem the element to be inserted.
     * @throws `Error` when the stack reaches its maximum capacity of 1024 elements.
     */
    push(elem: E): void | never {
        if (this.values.length >= 1024) {
            throw new ExecError('Stack too deep');
        }

        this.values.unshift(elem);
    }

    /**
     * Removes the top element from the stack and returns it.
     *
     * @returns the top element of the stack.
     * @throws `Error` when the stack is empty.
     */
    pop(): E | never {
        if (this.values.length === 0) {
            throw new ExecError('POP with empty stack');
        }

        // The non-null assertion operator `!` is needed here because the
        // guard `length === 0` does not track array's emptiness.
        // See https://github.com/microsoft/TypeScript/issues/30406.
        return this.values.shift()!;
    }

    /**
     * Swaps the element at `position` with the top element of the stack.
     *
     * @param secondPosition the position of the element to be swapped.
     * @throws `Error` when `secondPosition` is not in the range [1, 16) or the element at `secondPosition` does not exist in this `Stack`.
     */
    swap(secondPosition: number): void | never {
        if (secondPosition < 1 || secondPosition > 16) {
            throw new ExecError('Unsupported position for swap operation');
        } else if (!(secondPosition in this.values)) {
            throw new ExecError('Position not found for swap operation,');
        }

        const firstValue = this.values[0]!;
        const secondValue = this.values[secondPosition]!;
        this.values[0] = secondValue;
        this.values[secondPosition] = firstValue;
    }

    /**
     * Creates a shallow copy of this `Stack`.
     *
     * @returns a new `Stack` with the same elements as this one.
     */
    clone(): Stack<E> {
        const stack = new Stack<E>();
        stack.values.push(...this.values);
        return stack;
    }
}

/**
 * Represents the state of an EVM run with statements `S` and expressions `E`.
 */
export class State<S = Inst, E = Expr> {
    /**
     * Indicates whether this `State` has been halted.
     */
    private _halted = false;

    /**
     * The statements executed that lead to this `State`.
     */
    readonly stmts: S[] = [];

    /**
     * The unique identifier of this `State` when it has been executed by the `EVM`.
     * The `id` is `undefined` when this `State` has not been executed yet.
     * 
     * The `id`s are assigned incrementally by the `EVM` in the order they are executed.
     */
    id: number | undefined;

    /**
     *
     * @param stack
     * @param memory
     * @param nlocals
     */
    constructor(
        readonly stack = new Stack<E>(),
        readonly memory: { [location: number]: E } = {},
        public nlocals = 0
    ) { }

    /**
     * Indicates whether this `State` has been halted.
     *
     * When `true`, no more execution should be allowed against this `State`.
     */
    get halted(): boolean {
        return this._halted;
    }

    /**
     * The last statement in this `State`.
     */
    get last(): S | undefined {
        return this.stmts.at(-1);
    }

    /**
     * Halts this `State`.
     * It adds `last` to `stmts` and sets `halted` to `true`.
     *
     * @param last The `S` that halts this `State`.
     */
    halt(last: S): void {
        if (this._halted) {
            throw new ExecError('State already halted');
        }

        this.stmts.push(last);
        this._halted = true;
    }

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
    clone(): State<S, E> {
        return new State(this.stack.clone(), { ...this.memory }, this.nlocals);
    }
}

/**
 * Represents the operand `stack` of the `State`.
 */
export type Operand<E = Expr> = Pick<State<never, E>, 'stack'>;

/**
 * Represents the volatile memory of the `State`, _i.e._, its `stack` and `memory`.
 */
export type Ram<E = Expr> = Pick<State<never, E>, 'stack' | 'memory'>;

/**
 * Represents an error due to an invalid symbolic state execution.
 */
export class ExecError extends Error {

}