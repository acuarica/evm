export declare class Stack<T> {
    elements: T[];
    constructor();
    push(item: T): void;
    pop(): T | never;
    dup(position: number): void | never;
    swap(secondPosition: number): void | never;
    clone(): Stack<T>;
    reset(): void;
}
