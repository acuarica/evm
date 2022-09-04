import { Stack } from '../stack';
import { Expr, isBigInt, isZero, stringify } from './utils';
import { Sar, Shl } from './logic';

export class Bin {
    readonly wrapped = true;

    constructor(readonly op: string, readonly left: Expr, readonly right: Expr) {}

    toString() {
        return `${stringify(this.left)} ${this.op} ${stringify(this.right)}`;
    }
}

export class Add extends Bin {
    constructor(left: Expr, right: Expr) {
        super('+', left, right);
    }
}

export class Mul extends Bin {
    constructor(left: Expr, right: Expr) {
        super('*', left, right);
    }
}

export class Sub extends Bin {
    constructor(left: Expr, right: Expr) {
        super('-', left, right);
    }
}

export class Div extends Bin {
    constructor(left: Expr, right: Expr) {
        super('/', left, right);
    }
}

export class Mod extends Bin {
    constructor(left: Expr, right: Expr) {
        super('%', left, right);
    }
}
export class Exp extends Bin {
    constructor(left: Expr, right: Expr) {
        super('**', left, right);
    }
}

export const MATH = {
    ADD: (stack: Stack<Expr>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? left + right
                : isZero(left)
                ? right
                : isZero(right)
                ? left
                : new Add(left, right)
        );
    },

    MUL: (stack: Stack<Expr>) => {
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

    SUB: (stack: Stack<Expr>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left - right : new Sub(left, right));
    },

    DIV: div,
    SDIV: div,
    MOD: mod,
    SMOD: mod,

    ADDMOD: (stack: Stack<Expr>) => {
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

    MULMOD: (stack: Stack<Expr>) => {
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

    EXP: (stack: Stack<Expr>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right) && right >= 0 ? left ** right : new Exp(left, right)
        );
    },

    SIGNEXTEND: (stack: Stack<Expr>) => {
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

function div(stack: Stack<Expr>) {
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

function mod(stack: Stack<Expr>) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? left % right : new Mod(left, right));
}
