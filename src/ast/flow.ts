import type { State } from '../state.ts';
import { type Inst, type Expr, type IInst, Tag } from './index.ts';

/**
 * Represents a jump from one `State` to another from the given `pc`.
 */
export class Branch {
    readonly pc: number;
    public state: State<Inst, Expr>;
    constructor(pc: number, state: State<Inst, Expr>) {
        this.pc = pc;
        this.state = state;
    }

    static make(pc: number, state: State<Inst, Expr>) {
        return new Branch(pc, state.clone());
    }
}

export class Jump implements IInst {
    readonly name = 'Jump';

    readonly offset: Expr;
    readonly destBranch: Branch;
    readonly pushStateId: number;

    constructor(offset: Expr, destBranch: Branch, pushStateId: number) {
        this.offset = offset;
        this.destBranch = destBranch;
        this.pushStateId = pushStateId;
    }

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

    readonly cond: Expr;
    readonly offset: Expr;
    readonly fallBranch: Branch;
    readonly destBranch: Branch;
    readonly pushStateId: number;

    constructor(
        cond: Expr,
        offset: Expr,
        fallBranch: Branch,
        destBranch: Branch,
        pushStateId: number,
    ) {
        this.cond = cond;
        this.offset = offset;
        this.fallBranch = fallBranch;
        this.destBranch = destBranch;
        this.pushStateId = pushStateId;

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

    readonly fallBranch: Branch;

    constructor(fallBranch: Branch) {
        this.fallBranch = fallBranch;
    }

    eval() {
        return this;
    }

    next() {
        return [this.fallBranch];
    }
}

export class Sig extends Tag {
    readonly tag = 'Sig';

    readonly selector: string;
    readonly positive: boolean;

    constructor(selector: string, positive = true) {
        super(0, 1);

        this.selector = selector;
        this.positive = positive;
    }
    eval(): Expr {
        return this;
    }
}

export class SigCase implements IInst {
    readonly name = 'SigCase';

    readonly condition: Sig;
    readonly offset: Expr;
    readonly fallBranch: Branch;

    constructor(condition: Sig, offset: Expr, fallBranch: Branch) {
        this.condition = condition;
        this.offset = offset;
        this.fallBranch = fallBranch;
    }

    eval() {
        return this;
    }

    next(): Branch[] {
        return [this.fallBranch];
    }
}
