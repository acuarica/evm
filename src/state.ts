import type { Expr, Inst } from "./ast";

/**
 * Represents an `Error` due to an invalid symbolic state execution.
 */
export class ExecError extends Error { }

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
     * Creates a shallow copy of this `Stack`.
     *
     * @returns a new `Stack` with the same elements as `this` one.
     */
    clone(): Stack<E> {
        const stack = new Stack<E>();
        stack.values.push(...this.values);
        return stack;
    }

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
}

/**
 * EVM memory is not persistent and is destroyed at the end of the call context.
 * At the start of a call context, memory is initialized to `0`.
 * Reading and Writing from memory is usually done with `MLOAD` and `MSTORE` instructions respectively,
 * but can also be accessed by other instructions like `CREATE` or `EXTCODECOPY`.[1]
 * 
 * [1] https://www.evm.codes/about#memory
 */
export class Memory<in out E> {

    /**
     * Defines the maximun size allowed to invalidate.
     */
    readonly maxInvalidateSizeAllowed: bigint = 32n * 1024n;

    /**
     * Creates a new `Memory` with no locations set.
     */
    constructor(private readonly _map: Map<bigint, E> = new Map()) { }

    /**
     * Creates a shallow copy of this `Memory`.
     * That is, the `keys` are copied but the `values` are kept the same
     * for both `this` Memory and the `clone`d one.
     *
     * @returns a new `Memory` with the same elements as `this` one.
     */
    clone(): this {
        return new (this.constructor as new (map: Map<bigint, E>) => this)(new Map(this._map));
    }

    /**
     * @returns `boolean` indicating whether a value in the specified `location` exists or not.
     */
    has(location: bigint): boolean {
        return this._map.has(location);
    }

    /**
     * Returns a specified value from the `Memory` object.
     * If the value stored at the provided `location` is an `object`,
     * then you will get a reference to that `object` and any change made to that `object` will effectively modify it inside the `Memory`.
     * 
     * @returns Returns the value stored at the specified `location`. If no value is stored at the specified `location`, `undefined` is returned.
     */
    get(location: bigint): E | undefined {
        return this._map.get(location);
    }

    /**
     * Sets the new `value` at the specified `location`.
     * If a value at the same `location` already exists, the value will be updated.
     * 
     * @returns the `this` `Memory` so calls can be chained.
     */
    set(location: bigint, value: E): this {
        this._map.set(location, value);
        return this;
    }

    /**
     * @returns the number of values stored in the `Memory`.
     */
    get size(): number {
        return this._map.size;
    }

    /**
     * Returns an iterable of keys in the `Memory`.
     */
    keys(): IterableIterator<bigint> {
        return this._map.keys();
    }

    /**
     * Returns an iterable of location, value pairs for every entry in the `Memory`.
     */
    entries(): IterableIterator<[bigint, E]> {
        return this._map.entries();
    }

    /**
     * 
     * @param offset 
     * @param size 
     * @param miss 
     * @returns 
     */
    range(offset: bigint, size: bigint, miss: (location: bigint) => E) {
        const args = [];
        for (let i = offset; i < offset + size; i += 32n) {
            args.push(this.get(i) ?? miss(i));
        }
        return args;
    }

    /**
     * Invalidates the whole memory region.
     * 
     * That is, after `invalidateAll`, `get` with any argument will return `undefined`.
     */
    invalidateAll(): void {
        this._map.clear();
    }

    /**
     * Tries to invalidate the memory range indicated by `[offset, offset + size]`.
     * It can do so when both `offset` and `size` are reducible to `Val`,
     * and `size` is no greater than `maxInvalidateSizeAllowed`.
     * This last restriction is to avoid iterating over a large range.
     * 
     * Otherwise, when `invalidateAll` is set clears the whole memory.
     * 
     * @param offset the offset in memory to invalidate.
     * @param size the size to invalidate.
     * @param invalidateAll indicates to clear the whole memory in case neither `offset` nor `size` are not reducible to `Val`.
     */
    invalidateRange(offset: Expr, size: Expr, invalidateAll = true) {
        offset = offset.eval();
        size = size.eval();
        if (offset.isVal() && size.isVal() && size.val <= this.maxInvalidateSizeAllowed) {
            for (let i = offset.val; i < offset.val + size.val; i += 32n) {
                this._map.delete(i);
            }
        } else if (invalidateAll) {
            this.invalidateAll();
        }
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
        readonly memory = new Memory<E>(),
        public nlocals = 0
    ) { }

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
        return new State(this.stack.clone(), this.memory.clone(), this.nlocals);
    }

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
}

/**
 * Represents the operand `stack` of the `State`.
 */
export type Operand<E = Expr> = Pick<State<never, E>, 'stack'>;

/**
 * Represents the volatile memory of the `State`, _i.e._, its `stack` and `memory`.
 */
export type Ram<E = Expr> = Pick<State<never, E>, 'stack' | 'memory'>;
