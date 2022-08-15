import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class GAS {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'GAS';
        this.wrapped = false;
    }

    toString() {
        return 'gasleft()';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new GAS());
};
