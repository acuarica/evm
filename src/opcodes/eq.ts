import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class SIG {
    readonly name = 'SIG';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly hash: string) {}

    toString() {
        return 'msg.sig == ' + this.hash;
    }
}

export class EQ {
    readonly name = 'EQ';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' == ' + stringify(this.right);
    }
}

function isSHRCallData(inst: any) {
    return (
        inst.name === 'SHR' &&
        typeof inst.shift === 'bigint' &&
        inst.shift === 0xe0n &&
        typeof inst.value !== 'bigint' &&
        inst.value.name === 'CALLDATALOAD' &&
        inst.value.location === 0n
    );
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    let left = stack.pop();
    let right = stack.pop();

    if (typeof left === 'bigint' && typeof right === 'bigint') {
        stack.push(left === right ? 1n : 0n);
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
            stack.push(
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
            stack.push(
                new SIG(
                    '0'.repeat(64 - right.toString(16).length) +
                        right.toString(16).substring(0, 8 - (64 - right.toString(16).length))
                )
            );
        } else if (typeof left === 'bigint' && isSHRCallData(right)) {
            stack.push(new SIG(left.toString(16)));
        } else {
            stack.push(new EQ(left, right));
        }
    }
};
