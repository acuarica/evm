import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class GASLIMIT {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'GASLIMIT';
        this.wrapped = false;
    }

    toString() {
        return 'block.gaslimit';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new GASLIMIT());
};
