import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import { LT } from './lt';
import { GT } from './gt';
import stringify from '../utils/stringify';

export class ISZERO {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly item: any;

    constructor(item: any) {
        this.name = 'ISZERO';
        this.wrapped = true;
        this.item = item;
    }

    toString() {
        if (this.item.name === 'EQ') {
            return stringify(this.item.left) + ' != ' + stringify(this.item.right);
        } else {
            return stringify(this.item) + ' == 0';
        }
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const item = state.stack.pop();
    if (typeof item === 'bigint') {
        state.stack.push(item === 0n ? 1n : 0n);
    } else if (item.name === 'LT') {
        if (item.equal) {
            state.stack.push(new GT(item.left, item.right));
        } else {
            state.stack.push(new GT(item.left, item.right, true));
        }
    } else if (item.name === 'GT') {
        if (item.equal) {
            state.stack.push(new LT(item.left, item.right));
        } else {
            state.stack.push(new LT(item.left, item.right, true));
        }
    } else if (item instanceof ISZERO) {
        state.stack.push(item.item);
    } else {
        state.stack.push(new ISZERO(item));
    }
};
