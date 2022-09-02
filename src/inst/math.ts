import { isBigInt } from './$lib';
import { Stack } from '../stack';
import stringify from '../utils/stringify';
import { Sar, Shl } from './logic';
import { Operand } from '../state';

export class Add {
    readonly name = 'ADD';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    // get type() {
    //     if (this.left.type === this.right.type) {
    //         return this.left.type;
    //     } else if (!this.left.type && this.right.type) {
    //         return this.right.type;
    //     } else if (!this.right.type && this.left.type) {
    //         return this.left.type;
    //     } else {
    //         return false;
    //     }
    // }

    toString() {
        return `${stringify(this.left)} + ${stringify(this.right)}`;
    }
}

export class Mul {
    readonly name = 'MUL';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString() {
        return `${stringify(this.left)} * ${stringify(this.right)}`;
    }
}

export class Sub {
    readonly name = 'SUB';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} - ${stringify(this.right)}`;
}

export class Div {
    readonly name = 'DIV';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} / ${stringify(this.right)}`;
}

export class Mod {
    readonly name = 'MOD';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} % ${stringify(this.right)}`;
}

export class Exp {
    readonly name = 'EXP';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => stringify(this.left) + ' ** ' + stringify(this.right);
}

export const MATH = {
    ADD: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? left + right
                : isBigInt(left) && left === 0n
                ? right
                : isBigInt(right) && right === 0n
                ? left
                : new Add(left, right)
        );
    },

    MUL: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? left * right
                : (isBigInt(left) && left === 0n) || (isBigInt(right) && right === 0n)
                ? 0n
                : new Mul(left, right)
        );
    },

    SUB: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left - right : new Sub(left, right));
    },

    DIV: div,
    SDIV: div,
    MOD: mod,
    SMOD: mod,

    ADDMOD: (stack: Stack<Operand>) => {
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

    MULMOD: (stack: Stack<Operand>) => {
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

    EXP: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right) && right >= 0 ? left ** right : new Exp(left, right)
        );
    },

    SIGNEXTEND: (stack: Stack<Operand>) => {
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

function div(stack: Stack<Operand>) {
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

function mod(stack: Stack<Operand>) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? left % right : new Mod(left, right));
}
