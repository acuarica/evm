import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class RETURNDATACOPY {
    readonly name = 'RETURNDATACOPY';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly returnDataPosition: any, readonly returnDataSize: any) {}

    toString() {
        return (
            'output[' +
            stringify(this.returnDataPosition) +
            ':(' +
            stringify(this.returnDataPosition) +
            '+' +
            stringify(this.returnDataSize) +
            ')]'
        );
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const memoryPosition = state.stack.pop();
    const returnDataPosition = state.stack.pop();
    const returnDataSize = state.stack.pop();

    if (typeof memoryPosition !== 'number') {
        throw new Error('expected number in returndatacopy');
    }

    state.memory[memoryPosition] = new RETURNDATACOPY(returnDataPosition, returnDataSize);
};
