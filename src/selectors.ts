import type { Opcode } from './decode.ts';
import { type Inst, Lit, type Local, type SExpr } from './sexpr.ts';
import type { State, Step } from './sevm.ts';

export interface IPublicBranches {

    /**
     * 
     */
    readonly selectors: WeakMap<Local, string>;

    /**
     * 
     */
    readonly publicBranches: Map<string, { pc: number, state: State }>;
}

/**
 * 
 * @param Klass 
 * @returns 
 */
function JMP<T extends Cons<Step<'JUMPI'>>>(Klass: T): T & Cons<IPublicBranches> {
    return class extends Klass implements IPublicBranches {
        readonly selectors: IPublicBranches['selectors'] = new WeakMap();
        readonly publicBranches: IPublicBranches['publicBranches'] = new Map();

        JUMPI = (state: State, opcode: Opcode): Inst => {
            const inst = super.JUMPI(state, opcode);
            const [offset, cond] = inst.args;

            const selector = this.selectors.get(cond);
            if (typeof selector === 'string') {
                // const [pc, contBranch] = cond.positive ? [destpc, fallBranch] : [opcode.pc + 1, destBranch];
                if (offset.expr instanceof Lit) {
                    const pc = Number(offset.expr.value);
                    this.publicBranches.set(selector, { pc, state });
                }
            }

            return inst;
        }
    };
}

/**
 * 
 * @param Klass 
 * @returns 
 */
function DivExpEQ<T extends Cons<Step<'EQ'>>>(Klass: T): T {
    return class extends Klass {
        EQ = (state: State, opcode: Opcode): Inst => {
            const inst = super.EQ(state, opcode);
            const [left, right] = state.stack.top!;

            const rr = right.args[1];
            if (left instanceof Lit && right.ex === 'div' && rr.expr instanceof Lit) {
                const selector = left.value * rr.expr.value;
                const r = right.args[0].expr;

                if (selector % (1n << 0xe0n) === 0n &&
                    r.ex === 'calldataload' &&
                    r.args[0].expr instanceof Lit &&
                    r.args[0].expr.value === 0n
                ) {
                    const s = selector
                        .toString(16)
                        .substring(0, 8 - (64 - selector.toString(16).length))
                        .padStart(8, '0');
                    console.log(s);
                }
            }

            return inst;
        }
    };
}

function isZero(expr: SExpr) {
    return expr instanceof Lit && expr.value === 0n;
}

function isSelectorCallData(expr: SExpr) {
    const [shift, value] = expr;

    return expr.ex === 'shr' &&
        shift instanceof Lit &&
        shift.value === 0xe0n &&
        value.ex === 'calldataload' &&
        isZero(value.args[0].expr);
}

function ShrEQ<T extends Cons<IPublicBranches & Step<'EQ'>>>(Klass: T): T {
    return class extends Klass {
        override EQ = (state: State, opcode: Opcode): Inst => {
            const inst = super.EQ(state, opcode);

            const SHRsig = (left: SExpr, right: SExpr): string | undefined => {
                return left instanceof Lit && isSelectorCallData(right)
                    ? left.value.toString(16).padStart(8, '0')
                    : undefined;
            };
            const [left, right] = state.stack.top!;
            const sig = SHRsig(left, right) ?? SHRsig(right, left);
            if (sig !== undefined) {
                this.selectors.set(state.stack.top!, sig);
                // state.stack.top!.props['selector'] = sig;
            }

            return inst;
        }
    };
}

export function Selectors<T extends Cons<Step<'JUMPI' | 'EQ'>>>(Klass: T): T & Cons<IPublicBranches> {
    return ShrEQ(DivExpEQ(JMP(Klass)));
}