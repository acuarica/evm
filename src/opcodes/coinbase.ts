import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class COINBASE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'COINBASE';
        this.wrapped = false;
    }

    toString() {
        return 'block.coinbase';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new COINBASE());
};
