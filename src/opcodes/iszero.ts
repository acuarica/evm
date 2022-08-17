import { EVM, Operand } from '../evm';
import { Opcode } from '../opcode';
import { LT } from './lt';
import { GT } from './gt';
import stringify from '../utils/stringify';
import { EQ } from './eq';

export class IsZero {
    readonly name = 'ISZERO';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: Operand) {}

    toString() {
        return this.value instanceof EQ
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
            : value instanceof IsZero
            ? value.value
            : new IsZero(value)
    );
};
