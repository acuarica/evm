import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class GT {
    readonly name = 'GT';
    readonly type?: string;
    readonly wrapped = true;
    // readonly equal: boolean;

    constructor(readonly left: any, readonly right: any, readonly equal = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' >= ' : ' > ') + stringify(this.right);
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(
        typeof left === 'bigint' && typeof right === 'bigint'
            ? left > right
                ? 1n
                : 0n
            : new GT(left, right)
    );
};
