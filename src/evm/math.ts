import type { Stack } from '../state';
import { Bin, type Expr, Val } from './expr';
import { Sar, Shl } from './logic';

export class Add extends Bin('Add', '+', 11) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal()
            ? new Val(left.val + right.val)
            : left.isZero()
            ? right
            : right.isZero()
            ? left
            : new Add(left, right);
    }
}

export class Mul extends Bin('Mul', '*', 12) {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal()
            ? new Val(lhs.val * rhs.val)
            : lhs.isZero() || rhs.isZero()
            ? new Val(0n)
            : new Mul(lhs, rhs);
    }
}

export class Sub extends Bin('Sub', '-', Add.prec) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal()
            ? new Val(left.val - right.val)
            : right.isZero()
            ? left
            : new Sub(left, right);
    }
}

export class Div extends Bin('Div', '/', Mul.prec) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal()
            ? right.val === 0n
                ? new Div(left, right)
                : new Val(left.val / right.val)
            : right.isVal() && right.val === 1n
            ? left
            : new Div(left, right);
    }
}

export class Mod extends Bin('Mod', '%', Mul.prec) {
    eval(): Expr {
        const lhs = this.left.eval();
        const rhs = this.right.eval();
        return lhs.isVal() && rhs.isVal() ? new Val(lhs.val % rhs.val) : new Mod(lhs, rhs);
    }
}

export class Exp extends Bin('Exp', '**', 14) {
    eval(): Expr {
        const left = this.left.eval();
        const right = this.right.eval();
        return left.isVal() && right.isVal() && right.val >= 0
            ? new Val(left.val ** right.val)
            : new Exp(left, right);
    }
}

export const MATH = {
    ADD: bin(Add),
    MUL: bin(Mul),
    SUB: bin(Sub),
    DIV: bin(Div),
    SDIV: bin(Div),
    MOD: bin(Mod),
    SMOD: bin(Mod),

    ADDMOD: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        const mod = stack.pop();
        stack.push(
            left.isVal() && right.isVal() && mod.isVal()
                ? new Val((left.val + right.val) % mod.val)
                : left.isVal() && right.isVal()
                ? new Mod(new Val(left.val + right.val), mod)
                : new Mod(new Add(left, right), mod)
        );
    },

    MULMOD: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        const mod = stack.pop();
        stack.push(
            left.isVal() && right.isVal() && mod.isVal()
                ? new Val((left.val * right.val) % mod.val)
                : left.isVal() && right.isVal()
                ? new Mod(new Val(left.val * right.val), mod)
                : new Mod(new Mul(left, right), mod)
        );
    },

    EXP: bin(Exp),

    SIGNEXTEND: (stack: Stack<Expr>): void => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            left.isVal() && right.isVal()
                ? new Val((right.val << (32n - left.val)) >> (32n - left.val))
                : left.isVal()
                ? new Sar(new Shl(right, new Val(32n - left.val)), new Val(32n - left.val))
                : new Sar(new Shl(right, new Sub(new Val(32n), left)), new Sub(new Val(32n), left))
        );
    },
};

export function bin(Cons: new (lhs: Expr, rhs: Expr) => Expr): (stack: Stack<Expr>) => void {
    return function (stack: Stack<Expr>) {
        const lhs = stack.pop();
        const rhs = stack.pop();
        stack.push(new Cons(lhs, rhs));
    };
}
