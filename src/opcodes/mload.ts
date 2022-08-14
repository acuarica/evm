import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import stringify from '../utils/stringify';

export class MLOAD {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly location: any;

    constructor(location: any) {
        this.name = 'MLOAD';
        this.wrapped = true;
        this.location = location;
    }

    toString() {
        return 'memory[' + stringify(this.location) + ']';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const memoryLocation = state.stack.pop();
    if (typeof memoryLocation === 'bigint' && Number(memoryLocation) in state.memory) {
        state.stack.push(state.memory[Number(memoryLocation)]);
    } else {
        state.stack.push(new MLOAD(memoryLocation));
    }
};
