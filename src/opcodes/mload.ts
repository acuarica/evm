import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class MLOAD {
    readonly name = 'MLOAD';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: any) {}

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
