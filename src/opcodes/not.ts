import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class NOT {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly item: any;

    constructor(item: any) {
        this.name = 'NOT';
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
        state.stack.push(~item);
    } else {
        state.stack.push(new NOT(item));
    }
};
