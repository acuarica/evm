import type { Stmt, Expr, IStmt } from './ast';
import type { State } from '../state';
import type { Sig } from './logic';

export class Branch {
    constructor(readonly pc: number, readonly state: State<Stmt, Expr>) {}

    get key() {
        return this.pc;
    }
}

export class Jump implements IStmt {
    readonly name = 'Jump';

    constructor(readonly offset: Expr, readonly destBranch: Branch) {}

    toString() {
        return `goto :${this.offset} branch:${this.destBranch.key}`;
    }
    next() {
        return [this.destBranch];
    }
}

export class Jumpi implements IStmt {
    readonly name = 'Jumpi';

    constructor(
        readonly condition: Expr,
        readonly offset: Expr,
        readonly fallBranch: Branch,
        readonly destBranch: Branch
    ) {}

    toString() {
        return `when ${this.condition} goto ${this.destBranch.key} or fall ${this.fallBranch.key}`;
    }

    next() {
        return [this.destBranch, this.fallBranch];
    }
}

export class JumpDest implements IStmt {
    readonly name = 'JumpDest';
    constructor(readonly fallBranch: Branch) {}
    toString() {
        // return 'fall:' + this.fallBranch.key + ':' + this.fallBranch.path.join('->');
        return `fall: ${this.fallBranch.key}:`;
    }

    next() {
        return [this.fallBranch];
    }
}

export class SigCase implements IStmt {
    readonly name = 'SigCase';
    constructor(readonly condition: Sig, readonly offset: Expr, readonly fallBranch: Branch) {}
    toString() {
        return `case when ${this.condition} goto ${this.offset} or fall ${this.fallBranch.key}`;
    }

    next(): Branch[] {
        return [this.fallBranch];
    }
}

// export class If {
//     readonly name = 'If';
//     readonly wrapped = true;
//     constructor(
//         readonly condition: Expr,
//         readonly trueBlock?: Stmt[],
//         readonly falseBlock?: Stmt[]
//     ) {}
//     toString() {
//         return '(' + this.condition + ')';
//     }
//     eval() {
//         return this;
//     }
// }

// export class Require {
//     readonly name = 'Require';

//     constructor(readonly condition: Expr, readonly args: Expr[]) {}

//     toString() {
//         return `require(${this.condition}, ${this.args.join(', ')});`;
//     }
// }

// export class CallSite {
//     readonly name = 'CallSite';
//     constructor(readonly hash: string) {}
//     toString() {
//         return '#' + this.hash + '();';
//     }
// }

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
