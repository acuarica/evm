import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class AND {
    readonly name = 'AND';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' && ' + stringify(this.right);
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
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
};
