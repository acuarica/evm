import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class SHR {
    readonly name = 'SHR';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: any, readonly shift: any) {}

    toString() {
        return stringify(this.value) + ' >>> ' + stringify(this.shift);
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const shift = stack.pop();
    const value = stack.pop();

    stack.push(
        typeof value === 'bigint' && typeof shift === 'bigint'
            ? value >> shift
            : new SHR(value, shift)
    );
};
