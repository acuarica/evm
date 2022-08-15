export class Stack<T> {
    elements: T[];

    constructor() {
        this.elements = [];
    }

    push(item: T): void {
        if (this.elements.length >= 1024) {
            throw new Error('Stack too deep');
        } else {
            this.elements.unshift(item);
        }
    }

    pop(): T | never {
        if (this.elements.length === 0) {
            throw new Error('POP with empty stack');
        } else {
            return this.elements.shift()!;
        }
    }

    dup(position: number): void | never {
        if (position < 0 || position > 15) {
            throw new Error('Unsupported position for duplication operation');
        } else if (!(position in this.elements)) {
            throw new Error(
                "Invalid duplication operation, provided position wasn't found in stack"
            );
        } else {
            this.push(this.elements[position]);
        }
    }

    swap(secondPosition: number): void {
        if (secondPosition < 1 || secondPosition > 16) {
            throw new Error('Unsupported position for swap operation');
        } else if (!(secondPosition in this.elements)) {
            throw new Error("Invalid swap operation, provided position wasn't found in stack");
        } else {
            const firstValue = this.elements[0];
            const secondValue = this.elements[secondPosition];
            this.elements[0] = secondValue;
            this.elements[secondPosition] = firstValue;
        }
    }

    clone(): Stack<T> {
        const stack = new Stack<T>();
        stack.elements = [...this.elements];
        return stack;
    }

    reset(): void {
        this.elements = [];
    }
}
