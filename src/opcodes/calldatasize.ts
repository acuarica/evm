import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class CALLDATASIZE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'CALLDATASIZE';
        this.wrapped = false;
    }

    toString() {
        return 'msg.data.length';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new CALLDATASIZE());
};
