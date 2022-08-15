import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class RETURNDATASIZE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'RETURNDATASIZE';
        this.wrapped = false;
    }

    toString() {
        return 'output.length';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new RETURNDATASIZE());
};
