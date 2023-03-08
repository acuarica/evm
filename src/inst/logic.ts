import type { Stack } from '../state';
import {
    And,
    Byte,
    evalExpr,
    type Expr,
    GT,
    isBigInt,
    isVal,
    IsZero,
    isZero,
    LT,
    Not,
    Or,
    Sar,
    Shl,
    Xor,
} from '../ast';
import { CallDataLoad, Div, Eq } from '../ast';
import { Shr, Sig } from '../ast';

export function fromSHRsig(left: Expr, right: Expr, cc: () => Sig | Eq): Sig | Eq {
    if (
        isVal(left) &&
        right instanceof Shr &&
        isVal(right.shift) &&
        right.shift.value === 0xe0n &&
        right.value instanceof CallDataLoad &&
        isZero(right.value.location)
    ) {
        return new Sig(left.value.toString(16).padStart(8, '0'));
    }
    return cc();
}

export function fromDIVEXPsig(left: Expr, right: Expr, cc: () => Sig | Eq): Sig | Eq {
    left = evalExpr(left);
    right = evalExpr(right);

    if (isBigInt(left) && right instanceof Div && isBigInt(right.right)) {
        left = left * right.right;
        right = right.left;

        if (
            left % (1n << 0xe0n) === 0n &&
            right instanceof CallDataLoad &&
            isZero(right.location)
        ) {
            return new Sig(
                left
                    .toString(16)
                    .substring(0, 8 - (64 - left.toString(16).length))
                    .padStart(8, '0')
            );
        }
    }

    return cc();
}

export function eqHook(left: Expr, right: Expr, cc: () => Eq): Sig | Eq {
    return fromDIVEXPsig(left, right, () =>
        fromDIVEXPsig(right, left, () => fromSHRsig(left, right, () => fromSHRsig(right, left, cc)))
    );
}

export const LOGIC = {
    LT: lt,
    GT: gt,
    SLT: lt,
    SGT: gt,

    EQ: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();

        stack.push(
            isBigInt(left) && isBigInt(right)
                ? left === right
                    ? 1n
                    : 0n
                : eqHook(left, right, () => new Eq(left, right))
        );
    },

    ISZERO: (stack: Stack<Expr>): void => {
        const value = stack.pop();
        stack.push(
            // isBigInt(value)
            //     ? value === 0n
            //         ? 1n
            //         : 0n
            //     : value instanceof LT
            //     ? new GT(value.left, value.right, !value.equal)
            //     : value instanceof GT
            //     ? new LT(value.left, value.right, !value.equal)
            //     : value instanceof IsZero
            //     ? value.value
            //     :
            new IsZero(value)
        );
    },

    AND: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        if (isBigInt(left) && isBigInt(right)) {
            stack.push(left & right);
        } else if (isBigInt(left) && /^[f]+$/.test(left.toString(16))) {
            // (right as any).size = left.toString(16).length;
            stack.push(right);
        } else if (isBigInt(right) && /^[f]+$/.test(right.toString(16))) {
            // (left as any).size = right.toString(16).length;
            stack.push(left);
            /*} else if (
            isVal(left) &&
            left.equals('1461501637330902918203684832716283019655932542975')
        ) {*/
            /* 2 ** 160 */
            /*    state.stack.push(right);
        } else if (
            isVal(right) &&
            right.equals('1461501637330902918203684832716283019655932542975')
        ) {*/
            /* 2 ** 160 */
            /*    state.stack.push(left);*/
        } else if (
            isBigInt(left) &&
            right instanceof And &&
            isBigInt(right.left) &&
            left === right.left
        ) {
            stack.push(right.right);
        } else {
            stack.push(new And(left, right));
        }
    },

    OR: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left | right : new Or(left, right));
    },

    XOR: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left ^ right : new Xor(left, right));
    },

    NOT: (stack: Stack<Expr>): void => {
        const value = stack.pop();
        stack.push(isBigInt(value) ? ~value : new Not(value));
    },

    BYTE: (stack: Stack<Expr>): void => {
        const position = stack.pop();
        const data = stack.pop();
        stack.push(
            isBigInt(data) && isBigInt(position)
                ? (data >> position) & 1n
                : new Byte(position, data)
        );
    },

    SHL: (stack: Stack<Expr>): void => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value << shift : new Shl(value, shift));
    },

    SHR: (stack: Stack<Expr>): void => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Shr(value, shift));
    },

    SAR: (stack: Stack<Expr>): void => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Sar(value, shift));
    },
};

function lt(stack: Stack<Expr>): void {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left < right ? 1n : 0n) : new LT(left, right));
}

function gt(stack: Stack<Expr>): void {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left > right ? 1n : 0n) : new GT(left, right));
}
