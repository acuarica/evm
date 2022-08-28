export class Stack<T> {
    readonly values: T[] = [];

    push(item: T): void | never {
        if (this.values.length >= 1024) {
            throw new Error('Stack too deep');
        }

        this.values.unshift(item);
    }

    pop(): T | never {
        if (this.values.length === 0) {
            throw new Error('POP with empty stack');
        }

        // The non-null assertion operator `!` is needed here because the
        // guard `length === 0` does not track array's emptiness.
        // See https://github.com/microsoft/TypeScript/issues/30406.
        return this.values.shift()!;
    }

    dup(position: number): void | never {
        if (position < 0 || position > 15) {
            throw new Error('Unsupported position for duplication operation');
        } else if (!(position in this.values)) {
            throw new Error('Invalid duplication operation, position was not found');
        }

        this.push(this.values[position]);
    }

    swap(secondPosition: number): void | never {
        if (secondPosition < 1 || secondPosition > 16) {
            throw new Error('Unsupported position for swap operation');
        } else if (!(secondPosition in this.values)) {
            throw new Error('Invalid swap operation, position was not found');
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
}
