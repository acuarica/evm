import type { State } from '../state';
import { type Inst, type Expr, type IInst, Tag } from '.';

/**
 * Represents a jump from one `State` to another from the given `pc`.
 */
export class Branch {
    constructor(readonly pc: number, public state: State<Inst, Expr>) { }

    static make(pc: number, state: State<Inst, Expr>) {
        return new Branch(pc, state.clone());
    }
}

export class Jump implements IInst {
    readonly name = 'Jump';
    constructor(readonly offset: Expr, readonly destBranch: Branch, readonly pushStateId: number) { }

    eval() {
        return this;
    }

    next() {
        return [this.destBranch];
    }
}

export class Jumpi implements IInst {
    readonly name = 'Jumpi';

    readonly evalCond: Expr;

    constructor(
        readonly cond: Expr,
        readonly offset: Expr,
        readonly fallBranch: Branch,
        readonly destBranch: Branch,
        readonly pushStateId: number,
    ) {
        this.evalCond = cond.eval();
    }

    eval() {
        return new Jumpi(this.cond.eval(), this.offset, this.fallBranch, this.destBranch, this.pushStateId);
    }

    next() {
        return this.evalCond.isVal()
            ? this.evalCond.val === 0n
                ? [this.fallBranch]
                : [this.destBranch]
            : [this.destBranch, this.fallBranch];
    }
}

export class JumpDest implements IInst {
    readonly name = 'JumpDest';
    constructor(readonly fallBranch: Branch) { }
    eval() {
        return this;
    }

    next() {
        return [this.fallBranch];
    }
}

export class Sig extends Tag {
    readonly tag = 'Sig';
    constructor(readonly selector: string, readonly positive = true) {
        super();
    }
    eval(): Expr {
        return this;
    }
}

export class SigCase implements IInst {
    readonly name = 'SigCase';
    constructor(readonly condition: Sig, readonly offset: Expr, readonly fallBranch: Branch) { }
    eval() {
        return this;
    }

    next(): Branch[] {
        return [this.fallBranch];
    }
}
