import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class MOD {
    readonly name = 'MOD';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' % ' + stringify(this.right);
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(
        typeof left === 'bigint' && typeof right === 'bigint' ? left % right : new MOD(left, right)
    );
};
