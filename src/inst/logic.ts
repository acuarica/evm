import { Stack } from '../stack';
import { Expr, isBigInt, isZero, stringify } from './utils';
import { CallDataLoad } from './info';
import { Bin, Div } from './math';

export class Sig {
    readonly wrapped = false;

    constructor(readonly hash: string) {}

    toString() {
        return `msg.sig == ${this.hash}`;
    }
}

export function fromSHRsig(left: Expr, right: Expr, cc: () => Sig | Eq): Sig | Eq {
    if (
        isBigInt(left) &&
        right instanceof Shr &&
        isBigInt(right.shift) &&
        right.shift === 0xe0n &&
        right.value instanceof CallDataLoad &&
        isZero(right.value.location)
    ) {
        return new Sig(left.toString(16).padStart(8, '0'));
    }
    return cc();
}

export function fromDIVEXPsig(left: Expr, right: Expr, cc: () => Sig | Eq): Sig | Eq {
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

export class Eq extends Bin {
    constructor(left: Expr, right: Expr) {
        super('==', left, right);
    }
}

export class And extends Bin {
    constructor(left: Expr, right: Expr) {
        super('&&', left, right);
    }
}

export class Or extends Bin {
    constructor(left: Expr, right: Expr) {
        super('||', left, right);
    }
}

export class IsZero {
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: Expr) {}

    toString() {
        return this.value instanceof Eq
            ? stringify(this.value.left) + ' != ' + stringify(this.value.right)
            : stringify(this.value) + ' == 0';
    }
}

export class GT {
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Expr, readonly right: Expr, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' >= ' : ' > ') + stringify(this.right);
    }
}

export class LT {
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Expr, readonly right: Expr, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' <= ' : ' < ') + stringify(this.right);
    }
}

export class Xor {
    readonly wrapped = true;

    constructor(readonly left: Expr, readonly right: Expr) {}

    toString() {
        return `${stringify(this.left)} ^ ${stringify(this.right)}`;
    }
}

/**
 * https://www.evm.codes/#19
 */
export class Not {
    readonly name = 'NOT';
    readonly wrapped = true;

    constructor(readonly value: Expr) {}

    toString() {
        return `~${stringify(this.value)}`;
    }
}

export class Neg {
    readonly name = 'SYMBOL';
    readonly wrapped = true;

    constructor(readonly value: Expr) {}

    toString() {
        return `!${stringify(this.value)}`;
    }
}

/**
 * https://www.evm.codes/#1a
 */
export class Byte {
    readonly name = 'BYTE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly position: Expr, readonly data: Expr) {}

    toString() {
        return `(${stringify(this.data)} >> ${stringify(this.position)}) & 1`;
    }
}

/**
 * https://www.evm.codes/#1b
 */
export class Shl {
    readonly name = 'SHL';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly value: Expr, readonly shift: Expr) {}

    toString() {
        return `${stringify(this.value)} << ${stringify(this.shift)}`;
    }
}

/**
 * https://www.evm.codes/#1c
 */
export class Shr {
    readonly name = 'SHR';
    readonly wrapped = true;

    constructor(readonly value: Expr, readonly shift: Expr) {}

    toString() {
        return `${stringify(this.value)} >>> ${stringify(this.shift)}`;
    }
}

/**
 * https://www.evm.codes/#1d
 */
export class Sar {
    readonly name = 'SAR';
    readonly wrapped = true;

    constructor(readonly value: Expr, readonly shift: Expr) {}

    toString = () => `${stringify(this.value)} >> ${stringify(this.shift)}`;
}

export const LOGIC = {
    LT: lt,
    GT: gt,
    SLT: lt,
    SGT: gt,

    EQ: (stack: Stack<Expr>) => {
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

    ISZERO: (stack: Stack<Expr>) => {
        const value = stack.pop();
        stack.push(
            isBigInt(value)
                ? value === 0n
                    ? 1n
                    : 0n
                : value instanceof LT
                ? new GT(value.left, value.right, !value.equal)
                : value instanceof GT
                ? new LT(value.left, value.right, !value.equal)
                : value instanceof IsZero
                ? value.value
                : new IsZero(value)
        );
    },

    AND: (stack: Stack<Expr>) => {
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

    OR: (stack: Stack<Expr>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left | right : new Or(left, right));
    },

    XOR: (stack: Stack<Expr>) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left ^ right : new Xor(left, right));
    },

    NOT: (stack: Stack<Expr>) => {
        const value = stack.pop();
        stack.push(isBigInt(value) ? ~value : new Not(value));
    },

    BYTE: (stack: Stack<Expr>) => {
        const position = stack.pop();
        const data = stack.pop();
        stack.push(
            isBigInt(data) && isBigInt(position)
                ? (data >> position) & 1n
                : new Byte(position, data)
        );
    },

    SHL: (stack: Stack<Expr>) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value << shift : new Shl(value, shift));
    },

    SHR: (stack: Stack<Expr>) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Shr(value, shift));
    },

    SAR: (stack: Stack<Expr>) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Sar(value, shift));
    },
};

function lt(stack: Stack<Expr>) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left < right ? 1n : 0n) : new LT(left, right));
}

function gt(stack: Stack<Expr>) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left > right ? 1n : 0n) : new GT(left, right));
}
