import type { State } from '../state';
import { type Stmt, Tag, type Expr, type IStmt } from './ast';

export class MLoad extends Tag('MLoad') {
    /**
     * Loads word from memory.
     *
     * @param loc
     */
    constructor(readonly loc: Expr) {
        super();
    }

    eval(): this {
        return this;
    }

    str(): string {
        return `memory[${this.loc}]`;
    }
}

export class MStore implements IStmt {
    readonly name = 'MStore';

    constructor(readonly location: Expr, readonly data: Expr) {}

    toString(): string {
        return `memory[${this.location}] = ${this.data};`;
    }
}

export const MEMORY = {
    MLOAD: ({ stack, memory }: State<Stmt, Expr>): void => {
        let loc = stack.pop();
        loc = loc.eval();
        stack.push(
            loc.isVal() && Number(loc.val) in memory ? memory[Number(loc.val)] : new MLoad(loc)
        );
    },
    MSTORE: mstore,
    MSTORE8: mstore,
};

function mstore({ stack, memory, stmts }: State<Stmt, Expr>): void {
    let loc = stack.pop();
    const data = stack.pop();

    loc = loc.eval();
    if (loc.isVal()) {
        memory[Number(loc.val)] = data;
    } else {
        stmts.push(new MStore(loc, data));
    }
}
