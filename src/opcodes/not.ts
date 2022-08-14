import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import stringify from '../utils/stringify';

export class NOT {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly item: any;

    constructor(item: any) {
        this.name = 'AND';
        this.wrapped = true;
        this.item = item;
    }

    toString() {
        return '~' + stringify(this.item);
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const item = state.stack.pop();
    if (typeof item === 'bigint') {
        state.stack.push(!item);
    } else {
        state.stack.push(new NOT(item));
    }
};
