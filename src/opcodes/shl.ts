import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class SHL {
    readonly name = 'SHL';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly value: any, readonly shift: any) {}

    toString() {
        return stringify(this.value) + ' << ' + stringify(this.shift);
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const shift = stack.pop();
    const value = stack.pop();
    stack.push(
        typeof value === 'bigint' && typeof shift === 'bigint'
            ? value << shift
            : new SHL(value, shift)
    );
};
