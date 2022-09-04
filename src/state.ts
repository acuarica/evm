import { Stack } from './stack';
import { Expr } from './inst/utils';
import { Stop } from './inst/system';

export type Stmt = Stop;

/**
 *
 */
export class State {
    /**
     *
     */
    halted = false;

    /**
     *
     */
    readonly stmts: Stmt[] = [];

    /**
     *
     * @param stack
     * @param memory
     */
    constructor(
        readonly stack = new Stack<Expr>(),
        readonly memory: { [location: number]: Expr } = {}
    ) {}

    /**
     *
     * @returns
     */
    clone(): State {
        return new State(this.stack.clone(), { ...this.memory });
    }
}
