import { Expr, isBigInt, isZero, stringify } from './utils';
import { Stack } from '../stack';

export class CallDataLoad {
    readonly name = 'CALLDATALOAD';
    // readonly type = 'bytes32';
    readonly wrapped = false;

    constructor(readonly location: Expr) {}

    toString(): string {
        if (isBigInt(this.location) && isZero(this.location)) {
            return 'msg.data';
        } else if (isBigInt(this.location) && (this.location - 4n) % 32n === 0n) {
            return `_arg${(this.location - 4n) / 32n}`;
        } else {
            return `msg.data[${stringify(this.location)}]`;
        }
    }
}

export class CALLDATASIZE {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'msg.data.length';
    }
}

export class CallValue {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'msg.value';
    }
}

export const INFO = {
    // Environmental Information (since Frontier)
    CALLVALUE: (stack: Stack<Expr>) => {
        stack.push(new CallValue());
    },
    CALLDATALOAD: (stack: Stack<Expr>) => {
        const location = stack.pop();
        stack.push(new CallDataLoad(location));
    },
    CALLDATASIZE: (stack: Stack<Expr>) => {
        stack.push(new CALLDATASIZE());
    },
};
