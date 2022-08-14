import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import stringify from '../utils/stringify';

export class SUB {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;

    constructor(left: any, right: any) {
        this.name = 'SUB';
        this.wrapped = true;
        this.left = left;
        this.right = right;
    }

    toString() {
        return stringify(this.left) + ' - ' + stringify(this.right);
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    if (typeof left === 'bigint' && typeof right === 'bigint') {
        state.stack.push(left - right);
    } else {
        state.stack.push(new SUB(left, right));
    }
};
