import type { Inst, Expr, IInst } from './expr';
import type { State } from '../state';
import type { Sig } from './logic';
import { type decode, type Opcode } from '../opcode';
export declare class Branch {
    readonly pc: number;
    readonly state: State<Inst, Expr>;
    constructor(pc: number, state: State<Inst, Expr>);
    get key(): number;
}
export declare class Jump implements IInst {
    readonly offset: Expr;
    readonly destBranch: Branch;
    readonly name = "Jump";
    constructor(offset: Expr, destBranch: Branch);
    eval(): this;
    toString(): string;
    next(): Branch[];
}
export declare class Jumpi implements IInst {
    readonly cond: Expr;
    readonly offset: Expr;
    readonly fallBranch: Branch;
    readonly destBranch: Branch;
    readonly name = "Jumpi";
    readonly evalCond: Expr;
    constructor(cond: Expr, offset: Expr, fallBranch: Branch, destBranch: Branch);
    eval(): this;
    toString(): string;
    next(): Branch[];
}
export declare class JumpDest implements IInst {
    readonly fallBranch: Branch;
    readonly name = "JumpDest";
    constructor(fallBranch: Branch);
    eval(): this;
    toString(): string;
    next(): Branch[];
}
export declare class SigCase implements IInst {
    readonly condition: Sig;
    readonly offset: Expr;
    readonly fallBranch: Branch;
    readonly name = "SigCase";
    constructor(condition: Sig, offset: Expr, fallBranch: Branch);
    eval(): this;
    toString(): string;
    next(): Branch[];
}
export declare function makeBranch(pc: number, state: State<Inst, Expr>): Branch;
export interface ISelectorBranches {
    /**
     * store selectors starting point.
     */
    readonly functionBranches: Map<string, {
        pc: number;
        state: State<Inst, Expr>;
    }>;
}
export declare function FLOW({ opcodes, jumpdests }: ReturnType<typeof decode>, { functionBranches }: ISelectorBranches): {
    JUMP: (_opcode: Opcode, state: State<Inst, Expr>) => void;
    JUMPI: (opcode: Opcode, state: State<Inst, Expr>) => void;
};
