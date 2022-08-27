export class Stack<T> {
    elements: T[] = [];

    push(item: T): void | never {
        if (this.elements.length >= 1024) {
            throw new Error('Stack too deep');
        }

        this.elements.unshift(item);
    }

    pop(): T | never {
        if (this.elements.length === 0) {
            throw new Error('POP with empty stack');
        }

        // The non-null assertion operator `!` is needed here because the
        // guard `length === 0` does not track array's emptiness.
        // See https://github.com/microsoft/TypeScript/issues/30406.
        return this.elements.shift()!;
    }

    dup(position: number): void | never {
        if (position < 0 || position > 15) {
            throw new Error('Unsupported position for duplication operation');
        } else if (!(position in this.elements)) {
            throw new Error('Invalid duplication operation, position was not found');
        }

        this.push(this.elements[position]);
    }

    swap(secondPosition: number): void | never {
        if (secondPosition < 1 || secondPosition > 16) {
            throw new Error('Unsupported position for swap operation');
        } else if (!(secondPosition in this.elements)) {
            throw new Error('Invalid swap operation, position was not found');
        }

        const firstValue = this.elements[0];
        const secondValue = this.elements[secondPosition];
        this.elements[0] = secondValue;
        this.elements[secondPosition] = firstValue;
    }

    clone(): Stack<T> {
        const stack = new Stack<T>();
        stack.elements = [...this.elements];
        return stack;
    }
}
