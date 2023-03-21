import type { Stmt, Expr, IStmt, Val } from './expr';
import type { State } from '../state';
import type { Sig } from './logic';
import { type decode, formatOpcode, type Opcode } from '../opcode';
import { Invalid } from './system';

type Result<T, E> =
    | { readonly tag: 'ok'; readonly val: T }
    | { readonly tag: 'err'; readonly err: E };
const Ok = <T>(val: T) => ({ tag: 'ok' as const, val });
const Err = <E>(err: E) => ({ tag: 'err' as const, err });
const isOk = <T, E>(result: Result<T, E>): result is ReturnType<typeof Ok<T>> =>
    result.tag === 'ok';

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

export function makeBranch(pc: number, state: State<Stmt, Expr>) {
    return new Branch(pc, state.clone());
}

export interface IEVMSelectorBranches {
    /**
     * store selectors starting point.
     */
    readonly functionBranches: Map<string, { pc: number; state: State<Stmt, Expr> }>;
}

export function FLOW(
    { opcodes, jumpdests }: ReturnType<typeof decode>,
    { functionBranches }: IEVMSelectorBranches
) {
    return {
        JUMP: (_opcode: Opcode, state: State<Stmt, Expr>): void => {
            const offset = state.stack.pop();
            const dest = getDest(offset);
            if (isOk(dest)) {
                const destBranch = makeBranch(dest.val, state);
                state.halt(new Jump(offset, destBranch));
            } else {
                state.halt(new Invalid(dest.err));
            }
        },

        JUMPI: (opcode: Opcode, state: State<Stmt, Expr>): void => {
            const offset = state.stack.pop();
            const cond = state.stack.pop();

            const dest = getDest(offset);
            if (isOk(dest)) {
                const cond2 = cond.eval();
                if (cond2.isVal()) {
                    if (cond2.val === 0n) {
                        const fallBranch = makeBranch(opcode.pc + 1, state);
                        state.halt(new Jump(offset, fallBranch));
                    } else {
                        const destBranch = makeBranch(dest.val, state);
                        state.halt(new Jump(offset, destBranch));
                    }
                    return;
                }

                const fallBranch = makeBranch(opcode.pc + 1, state);

                let last: SigCase | Jumpi;
                if (cond.tag === 'Sig') {
                    functionBranches.set(cond.selector, {
                        pc: dest.val,
                        state: state.clone(),
                    });
                    last = new SigCase(cond, offset, fallBranch);
                } else {
                    last = new Jumpi(cond, offset, fallBranch, makeBranch(dest.val, state));
                }
                state.halt(last);
            } else {
                state.halt(new Invalid(dest.err));
            }
        },
    };

    /**
     *
     * @param offset
     * @returns
     */
    function getDest(offset: Expr): Result<number, string> {
        const offset2 = offset.eval();
        if (!offset2.isVal()) {
            return Err(`Expected numeric offset, found ${offset}`);
        }
        const dest = jumpdests[Number(offset2.val)];
        if (dest !== undefined) {
            (offset as Val).jumpDest = dest;
            return Ok(dest);
        } else {
            const dest = opcodes.find(o => o.offset === Number(offset2.val));
            if (!dest) {
                return Err('Expected `JUMPDEST` in JUMP destination, but none was found');
            }
            if (dest.mnemonic !== 'JUMPDEST') {
                return Err('JUMP destination should be JUMPDEST but found' + formatOpcode(dest));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (offset as any).jumpDest = dest.pc;
            return Ok(dest.pc);
        }
    }
}
