import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';

export class ADDRESS {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'ADDRESS';
        this.type = 'address';
        this.wrapped = false;
    }

    toString() {
        return 'this';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new ADDRESS());
};
