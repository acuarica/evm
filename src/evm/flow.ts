import type { State } from '../state';
import { type decode, formatOpcode, type Opcode } from '../opcode';

import type { Inst, Expr, IInst, Val } from './expr';
import type { Sig } from './logic';

/**
 * Represents a jump from one `State` to another from the given `pc`.
 */
export class Branch {
    constructor(readonly pc: number, readonly state: State<Inst, Expr>) {}

    get key() {
        return this.pc;
    }
}

export class Jump implements IInst {
    readonly name = 'Jump';

    constructor(readonly offset: Expr, readonly destBranch: Branch) {}

    eval() {
        return this;
    }
    toString() {
        return `goto :${this.offset} branch:${this.destBranch.key}`;
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
        readonly destBranch: Branch
    ) {
        this.evalCond = cond.eval();
    }

    eval() {
        return new Jumpi(this.cond.eval(), this.offset, this.fallBranch, this.destBranch);
    }

    toString() {
        return `when ${this.cond} goto ${this.destBranch.key} or fall ${this.fallBranch.key}`;
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
    constructor(readonly fallBranch: Branch) {}
    eval() {
        return this;
    }
    toString() {
        return `fall: ${this.fallBranch.key}:`;
    }

    next() {
        return [this.fallBranch];
    }
}

export class SigCase implements IInst {
    readonly name = 'SigCase';
    constructor(readonly condition: Sig, readonly offset: Expr, readonly fallBranch: Branch) {}
    eval() {
        return this;
    }
    toString() {
        return `case when ${this.condition} goto ${this.offset} or fall ${this.fallBranch.key}`;
    }

    next(): Branch[] {
        return [this.fallBranch];
    }
}

export function makeBranch(pc: number, state: State<Inst, Expr>) {
    return new Branch(pc, state.clone());
}

export interface ISelectorBranches {
    /**
     * store selectors starting point.
     */
    readonly functionBranches: Map<string, { pc: number; state: State<Inst, Expr> }>;
}

export function FLOW(
    { opcodes, jumpdests }: ReturnType<typeof decode>,
    { functionBranches }: ISelectorBranches
) {
    return {
        JUMP: (opcode: Opcode, state: State<Inst, Expr>): void => {
            const offset = state.stack.pop();
            const destpc = getDest(offset, opcode);
            const destBranch = makeBranch(destpc, state);
            state.halt(new Jump(offset, destBranch));
        },

        JUMPI: (opcode: Opcode, state: State<Inst, Expr>): void => {
            const offset = state.stack.pop();
            const cond = state.stack.pop();
            const destpc = getDest(offset, opcode);

            const fallBranch = makeBranch(opcode.pc + 1, state);

            let last: SigCase | Jumpi;
            if (cond.tag === 'Sig') {
                functionBranches.set(cond.selector, {
                    pc: destpc,
                    state: state.clone(),
                });
                last = new SigCase(cond, offset, fallBranch);
            } else {
                last = new Jumpi(cond, offset, fallBranch, makeBranch(destpc, state));
            }
            state.halt(last);
        },
    };

    /**
     *
     * @param offset
     * @param opcode Only used for error reporting.
     * @returns
     */
    function getDest(offset: Expr, opcode: Opcode): number {
        const offset2 = offset.eval();
        if (!offset2.isVal()) {
            throw new Error(
                `Expected numeric offset in top of stack, found ${offset} at ${formatOpcode(
                    opcode
                )}`
            );
        }
        const destpc = jumpdests[Number(offset2.val)];
        if (destpc !== undefined) {
            (offset as Val).jumpDest = destpc;
            return destpc;
        } else {
            const dest = opcodes.find(o => o.offset === Number(offset2.val));
            if (!dest) {
                throw new Error(
                    `Expected JUMPDEST in ${
                        opcode.mnemonic
                    } destination, ${offset2} , but none was found at '${formatOpcode(opcode)}'`
                );
            }
            throw new Error('JUMP destination should be JUMPDEST but found' + formatOpcode(dest));
        }
    }
}
