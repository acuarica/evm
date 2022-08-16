import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { LT } from './lt';
import { GT } from './gt';
import stringify from '../utils/stringify';

export class ISZERO {
    readonly name = 'ISZERO';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: any) {}

    toString() {
        return this.value.name === 'EQ'
            ? stringify(this.value.left) + ' != ' + stringify(this.value.right)
            : stringify(this.value) + ' == 0';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const value = stack.pop();
    stack.push(
        typeof value === 'bigint'
            ? value === 0n
                ? 1n
                : 0n
            : value.name === 'LT'
            ? new GT(value.left, value.right, !value.equal)
            : value.name === 'GT'
            ? new LT(value.left, value.right, !value.equal)
            : value instanceof ISZERO
            ? value.value
            : new ISZERO(value)
    );
};
