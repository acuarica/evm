import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class MUL {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;

    constructor(left: any, right: any) {
        this.name = 'MUL';
        this.wrapped = true;
        this.left = left;
        this.right = right;
    }

    toString() {
        return stringify(this.left) + ' * ' + stringify(this.right);
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    if (typeof left === 'bigint' && typeof right === 'bigint') {
        state.stack.push(left * right);
    } else if (
        (typeof left === 'bigint' && left === 0n) ||
        (typeof right === 'bigint' && right === 0n)
    ) {
        state.stack.push(0n);
    } else {
        state.stack.push(new MUL(left, right));
    }
};
