import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class LT {
    readonly name = 'LT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' <= ' : ' < ') + stringify(this.right);
    }
}

export default (_opcode: Opcode, { stack }: EVM) => {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(
        typeof left === 'bigint' && typeof right === 'bigint'
            ? left < right
                ? 1n
                : 0n
            : new LT(left, right)
    );
};
