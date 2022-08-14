import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import stringify from '../utils/stringify';

export class AND {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;

    constructor(left: any, right: any) {
        this.name = 'AND';
        this.wrapped = true;
        this.left = left;
        this.right = right;
    }

    toString() {
        return stringify(this.left) + ' && ' + stringify(this.right);
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    if (typeof left === 'bigint' && typeof right === 'bigint') {
        state.stack.push(left & right);
    } else if (typeof left === 'bigint' && /^[f]+$/.test(left.toString(16))) {
        right.size = left.toString(16).length;
        state.stack.push(right);
    } else if (typeof right === 'bigint' && /^[f]+$/.test(right.toString(16))) {
        left.size = right.toString(16).length;
        state.stack.push(left);
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
        state.stack.push(right.right);
    } else {
        state.stack.push(new AND(left, right));
    }
};
