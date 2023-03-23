import type { Stack } from '../state';
import { type Expr, Tag } from './expr';

export class CallValue extends Tag('CallValue') {
    eval(): Expr {
        return this;
    }
    str(): string {
        return 'msg.value';
    }
}

export class CallDataLoad extends Tag('CallDataLoad') {
    constructor(public location: Expr) {
        super();
    }
    eval(): Expr {
        this.location = this.location.eval();
        return this;
    }
    str(): string {
        return this.location.isVal() && this.location.val === 0n
            ? 'msg.data'
            : this.location.isVal() && (this.location.val - 4n) % 32n === 0n
            ? `_arg${(this.location.val - 4n) / 32n}`
            : `msg.data[${this.location._str(CallDataLoad.prec)}]`;
    }
}

export class CallDataSize extends Tag('CallDataSize') {
    eval(): Expr {
        return this;
    }
    str(): string {
        return 'msg.data.length';
    }
}

export const ENV = {
    /**
     * Get deposited value by the instruction/transaction responsible for this execution.
     *
     * @param stack
     */
    CALLVALUE: (stack: Stack<Expr>): void => stack.push(new CallValue()),
    CALLDATALOAD: (stack: Stack<Expr>): void => {
        const location = stack.pop();
        stack.push(new CallDataLoad(location));
    },
    CALLDATASIZE: (stack: Stack<Expr>): void => stack.push(new CallDataSize()),
};
