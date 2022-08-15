import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class GT {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;
    readonly equal: boolean;

    constructor(left: any, right: any, equal = false) {
        this.name = 'GT';
        this.wrapped = true;
        this.left = left;
        this.right = right;
        this.equal = equal;
    }

    toString() {
        if (this.equal) {
            return stringify(this.left) + ' >= ' + stringify(this.right);
        } else {
            return stringify(this.left) + ' > ' + stringify(this.right);
        }
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    if (typeof left === 'bigint' && typeof right === 'bigint') {
        state.stack.push(left > right ? 1n : 0n);
    } else {
        state.stack.push(new GT(left, right));
    }
};
