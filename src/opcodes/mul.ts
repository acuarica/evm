import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class MUL {
    readonly name = 'MUL';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' * ' + stringify(this.right);
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(
        typeof left === 'bigint' && typeof right === 'bigint'
            ? left * right
            : (typeof left === 'bigint' && left === 0n) ||
              (typeof right === 'bigint' && right === 0n)
            ? 0n
            : new MUL(left, right)
    );
};
