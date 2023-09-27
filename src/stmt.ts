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

    toString() {
        return `(${this.condition})`;
    }
}

export class CallSite {
    readonly name = 'CallSite';

    constructor(readonly selector: string) {}

    toString() {
        return `$${this.selector}();`;
    }
}

export class Require {
    readonly name = 'Require';

    constructor(readonly condition: Expr, readonly args: Expr[]) {}

    toString() {
        return `require(${[this.condition, ...this.args].join(', ')});`;
    }
}
