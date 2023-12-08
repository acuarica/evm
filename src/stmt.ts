import type { Expr, Inst } from './ast/expr';

/**
 *
 */
export type Stmt = Inst | If | CallSite | Require;

// export class Assign {
//     readonly name = 'Asign';
//     constructor(readonly i: number, readonly phi: Phi) {}
//     eval() {
//         return this;
//     }
//     toString() {
//         return `local${this.i} = ${this.phi.toString()};`;
//     }
// }

export class If {
    readonly name = 'If';
    constructor(
        readonly condition: Expr,
        readonly trueBlock?: Stmt[],
        readonly falseBlock?: Stmt[]
    ) {}
    eval() {
        return this;
    }
}

export class CallSite {
    readonly name = 'CallSite';
    constructor(readonly selector: string) {}
    eval() {
        return this;
    }
}

export class Require {
    readonly name = 'Require';
    constructor(readonly condition: Expr, readonly args: Expr[]) {}
    eval() {
        return this;
    }
}
