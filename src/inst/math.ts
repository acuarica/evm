import type { Stack } from '../state';
import { Add, Div, Exp, type Expr, isBigInt, isZero, Mod, Mul, Sub, Sar, Shl } from '../ast';

export const MATH = {
    ADD: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(new Add(left, right));
    },

    MUL: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? left * right
                : isZero(left) || isZero(right)
                ? 0n
                : new Mul(left, right)
        );
    },

    SUB: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left - right : new Sub(left, right));
    },

    DIV: div,
    SDIV: div,
    MOD: mod,
    SMOD: mod,

    ADDMOD: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        const mod = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right) && isBigInt(mod)
                ? (left + right) % mod
                : isBigInt(left) && isBigInt(right)
                ? new Mod(left + right, mod)
                : new Mod(new Add(left, right), mod)
        );
    },

    MULMOD: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        const mod = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right) && isBigInt(mod)
                ? (left * right) % mod
                : isBigInt(left) && isBigInt(right)
                ? new Mod(left * right, mod)
                : new Mod(new Mul(left, right), mod)
        );
    },

    EXP: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right) && right >= 0 ? left ** right : new Exp(left, right)
        );
    },

    SIGNEXTEND: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? (right << (32n - left)) >> (32n - left)
                : isBigInt(left)
                ? new Sar(new Shl(right, 32n - left), 32n - left)
                : new Sar(new Shl(right, new Sub(32n, left)), new Sub(32n, left))
        );
    },
};

function div(stack: Stack<Expr>): void {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(
        isBigInt(left) && isBigInt(right)
            ? right === 0n
                ? new Div(left, right)
                : left / right
            : isBigInt(right) && right === 1n
            ? left
            : new Div(left, right)
    );
}

function mod(stack: Stack<Expr>): void {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? left % right : new Mod(left, right));
}
