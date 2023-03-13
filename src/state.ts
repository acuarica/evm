/**
 *
 */
export class Stack<in out T> {
    readonly values: T[] = [];

    /**
     *
     * @param elem
     */
    push(elem: T): void | never {
        if (this.values.length >= 1024) {
            throw new Stack.Error('Stack too deep');
        }

        this.values.unshift(elem);
    }

    pop(): T | never {
        if (this.values.length === 0) {
            throw new Stack.Error('POP with empty stack');
        }

        // The non-null assertion operator `!` is needed here because the
        // guard `length === 0` does not track array's emptiness.
        // See https://github.com/microsoft/TypeScript/issues/30406.
        return this.values.shift()!;
    }

    dup(position: number): void | never {
        if (position < 0 || position > 15) {
            throw new Stack.Error('Unsupported position for duplication operation');
        } else if (!(position in this.values)) {
            throw new Stack.Error('Invalid duplication operation, position was not found');
        }

        this.push(this.values[position]);
    }

    swap(secondPosition: number): void | never {
        if (secondPosition < 1 || secondPosition > 16) {
            throw new Stack.Error('Unsupported position for swap operation');
        } else if (!(secondPosition in this.values)) {
            throw new Stack.Error('Invalid swap operation, position was not found');
        }

        const firstValue = this.values[0];
        const secondValue = this.values[secondPosition];
        this.values[0] = secondValue;
        this.values[secondPosition] = firstValue;
    }

    clone(): Stack<T> {
        const stack = new Stack<T>();
        stack.values.push(...this.values);
        return stack;
    }

    static Error = class extends Error {
        constructor(message: string) {
            super(message);
        }
        override name = 'Stack.Error';
    };
}

/**
 * Represents the state of an EVM run with statements `S` and expressions `E`.
 */
export class State<S, E> {
    /**
     * Whether this `State` has been halted.
     * When `true`, no more execution should be allowed in this `State`.
     */
    halted = false;

    /**
     * The statements executed that lead to this `State`.
     */
    readonly stmts: S[] = [];

    /**
     *
     * @param stack
     * @param memory
     */
    constructor(readonly stack = new Stack<E>(), readonly memory: { [location: number]: E } = {}) {}

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
        return new State(this.stack.clone(), { ...this.memory });
    }
}

/**
 * Represents the volatile memory of `State`, _i.e._, its `stack` and `memory`.
 */
export type Ram<E> = Pick<State<never, E>, 'stack' | 'memory'>;
