import type { Expr, Stmt } from './ast';

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
 *
 */
export class State<S = Stmt, E = Expr> {
    /**
     *
     */
    halted = false;

    /**
     *
     */
    readonly stmts: S[] = [];

    /**
     *
     * @param stack
     * @param memory
     */
    constructor(readonly stack = new Stack<E>(), readonly memory: { [location: number]: E } = {}) {}

    /**
     *
     * @returns
     */
    clone(): State<S, E> {
        return new State(this.stack.clone(), { ...this.memory });
    }
}
