import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class NUMBER {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'NUMBER';
        this.wrapped = false;
    }

    toString() {
        return 'block.number';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new NUMBER());
};
