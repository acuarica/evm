import type { Stack } from '../state';
import { type Expr, Tag, Bin, Val } from './expr';
import { bin } from './math';

function Cmp<N extends string>(tag: N, op: string) {
    abstract class Cmp extends Tag(tag, 9) {
        constructor(readonly left: Expr, readonly right: Expr, readonly equal: boolean = false) {
            super();
        }

        str() {
            return `${this.left._str(Cmp.prec)} ${
                this.equal ? `${op}=` : `${op}`
            } ${this.right._str(Cmp.prec)}`;
        }
    }

    return Cmp;
}

function Unary<N extends string>(tag: N, op: string, prec: number) {
    abstract class Unary extends Tag(tag, prec) {
        constructor(readonly value: Expr) {
            super();
        }

        str() {
            return `${op}${this.value._str(prec)}`;
        }
    }

    return Unary;
}

function Shift<N extends string>(tag: N, op: string) {
    abstract class Shift extends Tag(tag, Byte.prec) {
        constructor(readonly value: Expr, readonly shift: Expr) {
            super();
        }

        str() {
            return `${this.value._str(Shift.prec)} ${op} ${this.shift._str(Shift.prec)}`;
        }
    }

    return Shift;
}

export class Lt extends Cmp('Lt', '<') {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal() ? new Val(lhs.val < rhs.val ? 1n : 0n) : new Lt(lhs, rhs);
    }
}

export class Gt extends Cmp('Gt', '>') {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal() ? new Val(lhs.val > rhs.val ? 1n : 0n) : new Gt(lhs, rhs);
    }
}

export class Eq extends Bin('Eq', '==', 8) {
    eval(): Expr {
        return new Eq(this.left.eval(), this.right.eval());
    }
}

export class IsZero extends Tag('IsZero', Eq.prec) {
    constructor(readonly value: Expr) {
        super();
    }
    eval(): Expr {
        const val = this.value.eval();
        return val.isVal()
            ? val.val === 0n
                ? new Val(1n)
                : new Val(0n)
            : val.tag === 'Lt'
            ? new Gt(val.left, val.right, !val.equal)
            : val.tag === 'Gt'
            ? new Lt(val.left, val.right, !val.equal)
            : val.tag === 'IsZero'
            ? val.value
            : new IsZero(val);
    }
    str(): string {
        return this.value.tag === 'Eq'
            ? this.value.left._str(IsZero.prec) + ' != ' + this.value.right._str(IsZero.prec)
            : this.value._str(IsZero.prec) + ' == 0';
    }
}

export class And extends Bin('And', '&', 4) {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal()
            ? new Val(lhs.val & rhs.val)
            : lhs.isVal() && /^[f]+$/.test(lhs.val.toString(16))
            ? rhs
            : rhs.isVal() && /^[f]+$/.test(rhs.val.toString(16))
            ? lhs
            : lhs.isVal() && rhs.tag === 'And' && rhs.left.isVal() && lhs.val === rhs.left.val
            ? rhs.right
            : new And(lhs, rhs);
    }
}

export class Or extends Bin('Or', '|', 3) {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal() ? new Val(lhs.val | rhs.val) : new Or(lhs, rhs);
    }
}

export class Xor extends Bin('Xor', '^', 6) {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal() ? new Val(lhs.val ^ rhs.val) : new Xor(lhs, rhs);
    }
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_NOT
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
 *
 * > For `BigInt`s, there's no truncation.
 * > Conceptually, understand positive `BigInt`s as having an infinite number of leading 0 bits,
 * > and negative `BigInt`s having an infinite number of leading 1 bits.
 */
const X = 1n << 0x100n;
const mod = (n: bigint) => ((n % X) + X) % X;

export class Not extends Unary('Not', '~', 14) {
    eval(): Expr {
        const val = this.value.eval();
        return val.isVal() ? new Val(mod(~val.val)) : new Not(val);
    }
}

export class Byte extends Tag('Byte', 10) {
    constructor(readonly pos: Expr, readonly data: Expr) {
        super();
    }
    eval(): Expr {
        const pos = this.pos.eval();
        const data = this.data.eval();
        return data.isVal() && pos.isVal()
            ? new Val((data.val >> pos.val) & 1n)
            : new Byte(pos, data);
    }
    str(): string {
        return `(${this.data._str(Byte.prec)} >> ${this.pos._str(Byte.prec)}) & 1`;
    }
}

export class Shl extends Shift('Shl', '<<') {
    eval(): Expr {
        const val = this.value.eval();
        const shift = this.shift.eval();
        return val.isVal() && shift.isVal() ? new Val(val.val << shift.val) : new Shl(val, shift);
    }
}

export class Shr extends Shift('Shr', '>>>') {
    eval(): Expr {
        const val = this.value.eval();
        const shift = this.shift.eval();
        return val.isVal() && shift.isVal() ? new Val(val.val >> shift.val) : new Shr(val, shift);
    }
}

export class Sar extends Shift('Sar', '>>') {
    eval(): Expr {
        const val = this.value.eval();
        const shift = this.shift.eval();
        return val.isVal() && shift.isVal() ? new Val(val.val >> shift.val) : new Sar(val, shift);
    }
}

export class Sig extends Tag('Sig', Eq.prec) {
    constructor(readonly selector: string) {
        super();
    }
    eval(): Expr {
        return this;
    }
    str(): string {
        return `msg.sig == ${this.selector}`;
    }
}

export const LOGIC = {
    LT: bin(Lt),
    GT: bin(Gt),
    SLT: bin(Lt),
    SGT: bin(Gt),

    EQ: (stack: Stack<Expr>): void => {
        const DIVEXPsig = (left: Expr, right: Expr, orElse: () => Sig | Eq) => {
            left = left.eval();
            right = right.eval();

            if (left.isVal() && right.tag === 'Div' && right.right.isVal()) {
                const selector = left.val * right.right.val;
                right = right.left;

                if (
                    selector % (1n << 0xe0n) === 0n &&
                    right.tag === 'CallDataLoad' &&
                    right.location.isZero()
                ) {
                    return new Sig(
                        selector
                            .toString(16)
                            .substring(0, 8 - (64 - selector.toString(16).length))
                            .padStart(8, '0')
                    );
                }
            }

            return orElse();
        };

        const SHRsig = (left: Expr, right: Expr, orElse: () => Sig | Eq) => {
            if (
                left.isVal() &&
                right.tag === 'Shr' &&
                right.shift.isVal() &&
                right.shift.val === 0xe0n &&
                right.value.tag === 'CallDataLoad' &&
                right.value.location.isZero()
            ) {
                return new Sig(left.val.toString(16).padStart(8, '0'));
            }
            return orElse();
        };

        const left = stack.pop();
        const right = stack.pop();

        stack.push(
            left.isVal() && right.isVal()
                ? left.val === right.val
                    ? new Val(1n)
                    : new Val(0n)
                : DIVEXPsig(left, right, () =>
                      DIVEXPsig(right, left, () =>
                          SHRsig(left, right, () => SHRsig(right, left, () => new Eq(left, right)))
                      )
                  )
        );
    },

    ISZERO: (stack: Stack<Expr>): void => {
        const value = stack.pop();
        stack.push(new IsZero(value));
    },

    AND: bin(And),
    OR: bin(Or),
    XOR: bin(Xor),
    NOT: (stack: Stack<Expr>): void => {
        const value = stack.pop();
        stack.push(new Not(value));
    },

    BYTE: (stack: Stack<Expr>): void => {
        const position = stack.pop();
        const data = stack.pop();
        stack.push(new Byte(position, data));
    },

    SHL: shift(Shl),
    SHR: shift(Shr),
    SAR: shift(Sar),
};

export function shift(Cons: new (value: Expr, shift: Expr) => Expr): (stack: Stack<Expr>) => void {
    return function (stack: Stack<Expr>) {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(new Cons(value, shift));
    };
}
