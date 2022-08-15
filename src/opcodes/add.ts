import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class ADD {
    readonly name: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;

    constructor(left: any, right: any) {
        this.name = 'ADD';
        this.wrapped = true;
        this.left = left;
        this.right = right;
    }

    toString() {
        return stringify(this.left) + ' + ' + stringify(this.right);
    }

    get type() {
        if (this.left.type === this.right.type) {
            return this.left.type;
        } else if (!this.left.type && this.right.type) {
            return this.right.type;
        } else if (!this.right.type && this.left.type) {
            return this.left.type;
        } else {
            return false;
        }
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    state.stack.push(
        typeof left === 'bigint' && typeof right === 'bigint'
            ? left + right
            : typeof left === 'bigint' && left === 0n
            ? right
            : typeof right === 'bigint' && right === 0n
            ? left
            : new ADD(left, right)
    );
};
