import { isBigInt } from './$lib';
import { Stack } from '../stack';
import stringify from '../utils/stringify';
import { CallDataLoad } from '../inst/info';
import { Div } from '../inst/math';
import { Operand } from '../state';

export class SIG {
    readonly name = 'SIG';
    readonly wrapped = false;

    constructor(readonly hash: string) {}

    toString = () => `msg.sig == ${this.hash}`;
}

export class EQ {
    readonly name = 'EQ';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} == ${stringify(this.right)}`;
}

export function fromSHRsig(left: Operand, right: Operand, cc: () => SIG | EQ): SIG | EQ {
    if (
        typeof left === 'bigint' &&
        right instanceof Shr &&
        typeof right.shift === 'bigint' &&
        right.shift === 0xe0n &&
        right.value instanceof CallDataLoad &&
        right.value.location === 0n
    ) {
        return new SIG(left.toString(16).padStart(8, '0'));
    }
    return cc();
}

export function fromDIVEXPsig(left: Operand, right: Operand, cc: () => SIG | EQ): SIG | EQ {
    if (typeof left === 'bigint' && right instanceof Div && typeof right.right === 'bigint') {
        left = left * right.right;
        right = right.left;

        // /^[0]+$/.test(left.toString(16).substring(8)) &&
        if (left % (1n << 0xe0n) === 0n && right instanceof CallDataLoad && right.location === 0n) {
            return new SIG(
                left
                    .toString(16)
                    .substring(0, 8 - (64 - left.toString(16).length))
                    .padStart(8, '0')
            );
        }
    }

    return cc();
}

export function eqHook(left: Operand, right: Operand, cc: () => EQ): SIG | EQ {
    return fromDIVEXPsig(left, right, () =>
        fromDIVEXPsig(right, left, () => fromSHRsig(left, right, () => fromSHRsig(right, left, cc)))
    );
}

export class AND {
    readonly name = 'AND';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' && ' + stringify(this.right);
    }
}

export class OR {
    readonly name = 'OR';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString = () => stringify(this.left) + ' || ' + stringify(this.right);
}

export class IsZero {
    readonly name = 'ISZERO';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: Operand) {}

    toString() {
        return this.value instanceof EQ
            ? stringify(this.value.left) + ' != ' + stringify(this.value.right)
            : stringify(this.value) + ' == 0';
    }
}

export class GT {
    readonly name = 'GT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' >= ' : ' > ') + stringify(this.right);
    }
}

export class LT {
    readonly name = 'LT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' <= ' : ' < ') + stringify(this.right);
    }
}

/**
 * https://www.evm.codes/#18
 */
export class Xor {
    readonly name = 'XOR';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} ^ ${stringify(this.right)}`;
}

/**
 * https://www.evm.codes/#19
 */
export class Not {
    readonly name = 'NOT';
    readonly wrapped = true;

    constructor(readonly value: Operand) {}

    toString = () => `~${stringify(this.value)}`;
}

export class Neg {
    readonly name = 'SYMBOL';
    readonly wrapped = true;

    constructor(readonly value: Operand) {}

    toString = () => `!${stringify(this.value)}`;
}

/**
 * https://www.evm.codes/#1a
 */
export class Byte {
    readonly name = 'BYTE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly position: Operand, readonly data: Operand) {}

    toString = () => `(${stringify(this.data)} >> ${stringify(this.position)}) & 1`;
}

/**
 * https://www.evm.codes/#1b
 */
export class Shl {
    readonly name = 'SHL';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} << ${stringify(this.shift)}`;
}

/**
 * https://www.evm.codes/#1c
 */
export class Shr {
    readonly name = 'SHR';
    readonly wrapped = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} >>> ${stringify(this.shift)}`;
}

/**
 * https://www.evm.codes/#1d
 */
export class Sar {
    readonly name = 'SAR';
    readonly wrapped = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} >> ${stringify(this.shift)}`;
}

export const LOGIC = {
    LT: lt,
    GT: gt,
    SLT: lt,
    SGT: gt,

    EQ: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();

        stack.push(
            typeof left === 'bigint' && typeof right === 'bigint'
                ? left === right
                    ? 1n
                    : 0n
                : eqHook(left, right, () => new EQ(left, right))
        );
    },

    ISZERO: (stack: Stack<Operand>) => {
        const value = stack.pop();
        stack.push(
            isBigInt(value)
                ? value === 0n
                    ? 1n
                    : 0n
                : value.name === 'LT'
                ? new GT(value.left, value.right, !value.equal)
                : value.name === 'GT'
                ? new LT(value.left, value.right, !value.equal)
                : value instanceof IsZero
                ? value.value
                : new IsZero(value)
        );
    },

    AND: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();
        if (typeof left === 'bigint' && typeof right === 'bigint') {
            stack.push(left & right);
        } else if (typeof left === 'bigint' && /^[f]+$/.test(left.toString(16))) {
            (right as any).size = left.toString(16).length;
            stack.push(right);
        } else if (typeof right === 'bigint' && /^[f]+$/.test(right.toString(16))) {
            (left as any).size = right.toString(16).length;
            stack.push(left);
            /*} else if (
            typeof left === 'bigint' &&
            left.equals('1461501637330902918203684832716283019655932542975')
        ) {*/
            /* 2 ** 160 */
            /*    state.stack.push(right);
        } else if (
            typeof right === 'bigint' &&
            right.equals('1461501637330902918203684832716283019655932542975')
        ) {*/
            /* 2 ** 160 */
            /*    state.stack.push(left);*/
        } else if (
            typeof left === 'bigint' &&
            right instanceof AND &&
            typeof right.left === 'bigint' &&
            left === right.left
        ) {
            stack.push(right.right);
        } else {
            stack.push(new AND(left, right));
        }
    },

    OR: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left | right : new OR(left, right));
    },

    XOR: (stack: Stack<Operand>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left ^ right : new Xor(left, right));
    },

    NOT: (stack: Stack<Operand>) => {
        const value = stack.pop();
        stack.push(isBigInt(value) ? ~value : new Not(value));
    },

    BYTE: (stack: Stack<Operand>) => {
        const position = stack.pop();
        const data = stack.pop();
        stack.push(
            isBigInt(data) && isBigInt(position)
                ? (data >> position) & 1n
                : new Byte(position, data)
        );
    },

    SHL: (stack: Stack<Operand>) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value << shift : new Shl(value, shift));
    },

    SHR: (stack: Stack<Operand>) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Shr(value, shift));
    },

    SAR: (stack: Stack<Operand>) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Sar(value, shift));
    },
};

function lt(stack: Stack<Operand>) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left < right ? 1n : 0n) : new LT(left, right));
}

function gt(stack: Stack<Operand>) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left > right ? 1n : 0n) : new GT(left, right));
}
