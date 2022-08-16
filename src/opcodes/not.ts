import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class NOT {
    readonly name = 'NOT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly item: any) {}

    toString() {
        return '~' + stringify(this.item);
    }
}

export default (_opcode: Opcode, { stack }: EVM) => {
    const item = stack.pop();
    stack.push(typeof item === 'bigint' ? ~item : new NOT(item));
};
