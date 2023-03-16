import type { Stmt, Expr, IStmt } from './ast';
import type { State } from '../state';
import type { Sig } from './logic';
import { formatOpcode, type Opcode } from '../opcode';

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

export function makeBranch(pc: number, state: State<Stmt, Expr>) {
    return new Branch(pc, state.clone());
}

export interface IEVMSelectorBranches {
    /**
     * store selectors starting point.
     */
    readonly functionBranches: Map<string, { pc: number; state: State<Stmt, Expr> }>;
}

export function FLOW(opcodes: Opcode[], { functionBranches }: IEVMSelectorBranches) {
    return {
        JUMP: (_opcode: Opcode, state: State<Stmt, Expr>): void => {
            const offset = state.stack.pop();
            const dest = getDest(offset);
            const destBranch = makeBranch(dest.pc, state);
            state.halt(new Jump(offset, destBranch));
        },

        JUMPI: (opcode: Opcode, state: State<Stmt, Expr>): void => {
            const offset = state.stack.pop();
            const cond = state.stack.pop();

            const dest = getDest(offset);
            const fallBranch = makeBranch(opcode.pc + 1, state);

            let last: SigCase | Jumpi;
            if (cond.tag === 'Sig') {
                functionBranches.set(cond.selector, {
                    pc: dest.pc,
                    state: state.clone(),
                });
                last = new SigCase(cond, offset, fallBranch);
            } else {
                last = new Jumpi(cond, offset, fallBranch, makeBranch(dest.pc, state));
            }
            state.halt(last);
        },
    };

    /**
     *
     * @param offset
     * @returns
     */
    function getDest(offset: Expr): Opcode {
        const offset2 = offset.eval();
        if (!offset2.isVal()) {
            throw new Error('Expected numeric offset, found' + offset.toString());
        }
        const dest = opcodes.find(o => o.offset === Number(offset2.val));
        if (!dest) {
            throw new Error('Expected `JUMPDEST` in JUMP destination, but none was found');
        }
        if (dest.mnemonic !== 'JUMPDEST') {
            throw new Error('JUMP destination should be JUMPDEST but found' + formatOpcode(dest));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (offset as any).jumpDest = dest.pc;
        return dest;
    }
}
