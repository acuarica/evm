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

export default (_opcode: Opcode, { stack, memory }: EVM): void => {
    const memoryPosition = stack.pop();
    const returnDataPosition = stack.pop();
    const returnDataSize = stack.pop();

    if (typeof memoryPosition !== 'number') {
        // throw new Error('expected number in returndatacopy');
    }

    memory[memoryPosition as any] = new RETURNDATACOPY(returnDataPosition, returnDataSize);
};
