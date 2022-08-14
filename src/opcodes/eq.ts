import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import stringify from '../utils/stringify';

export class SIG {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly hash: string;

    constructor(hash: string) {
        this.name = 'SIG';
        this.wrapped = false;
        this.hash = hash;
    }

    toString() {
        return 'msg.sig == ' + this.hash;
    }
}

export class EQ {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;

    constructor(left: any, right: any) {
        this.name = 'EQ';
        this.wrapped = true;
        this.left = left;
        this.right = right;
    }

    toString() {
        return stringify(this.left) + ' == ' + stringify(this.right);
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    let left = state.stack.pop();
    let right = state.stack.pop();
    if (typeof left === 'bigint' && typeof right === 'bigint') {
        state.stack.push(left === right ? 1n : 0n);
    } else {
        if (typeof left === 'bigint' && right.name === 'DIV' && typeof right.right === 'bigint') {
            left = left * right.right;
            right = right.left;
        }
        if (typeof right === 'bigint' && left.name === 'DIV' && typeof left.right === 'bigint') {
            right = right * left.right;
            left = left.left;
        }
        if (
            typeof left === 'bigint' &&
            /^[0]+$/.test(left.toString(16).substring(8)) &&
            right.name === 'CALLDATALOAD' &&
            right.location === 0n
        ) {
            state.stack.push(
                new SIG(
                    '0'.repeat(64 - left.toString(16).length) +
                        left.toString(16).substring(0, 8 - (64 - left.toString(16).length))
                )
            );
        } else if (
            typeof right === 'bigint' &&
            /^[0]+$/.test(right.toString(16).substring(8)) &&
            left.name === 'CALLDATALOAD' &&
            left.location === 0
        ) {
            state.stack.push(
                new SIG(
                    '0'.repeat(64 - right.toString(16).length) +
                        right.toString(16).substring(0, 8 - (64 - right.toString(16).length))
                )
            );
        } else {
            state.stack.push(new EQ(left, right));
        }
    }
};
