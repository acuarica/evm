import type { State } from '../state';
import { type Stmt, Tag, Val, type Expr, type IStmt } from './ast';

export class MLoad extends Tag('MLoad', Val.prec) {
    constructor(readonly location: Expr) {
        super();
    }

    eval(): this {
        return this;
    }

    str(): string {
        return `memory[${this.location.str()}]`;
    }
}

export class MStore implements IStmt {
    readonly name = 'MStore';

    constructor(readonly location: Expr, readonly data: Expr) {}

    toString(): string {
        return `memory[${this.location.str()}] = ${this.data.str()};`;
    }
}

export const MEMORY = {
    MLOAD: ({ stack, memory }: State<Stmt, Expr>): void => {
        let memoryLocation = stack.pop();
        memoryLocation = memoryLocation.eval();
        stack.push(
            memoryLocation.isVal() && Number(memoryLocation.val) in memory
                ? memory[Number(memoryLocation.val)]
                : new MLoad(memoryLocation)
        );
    },
    MSTORE: mstore,
    MSTORE8: mstore,
};

function mstore({ stack, memory, stmts }: State<Stmt, Expr>): void {
    let storeLocation = stack.pop();
    const storeData = stack.pop();
    storeLocation = storeLocation.eval();
    if (storeLocation.isVal()) {
        memory[Number(storeLocation.val)] = storeData;
    } else {
        stmts.push(new MStore(storeLocation, storeData));
    }
}
