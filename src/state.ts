import { Stack } from './stack';
import { Expr, Stmt } from './ast';

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
