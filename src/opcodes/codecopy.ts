import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CODECOPY {
    readonly name = 'CODECOPY';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly startLocation: any, readonly copyLength: any) {}

    toString() {
        return (
            'this.code[' +
            stringify(this.startLocation) +
            ':(' +
            stringify(this.startLocation) +
            '+' +
            stringify(this.copyLength) +
            ')]'
        );
    }
}

export default (_opcode: Opcode, { stack, memory }: EVM): void => {
    const memoryLocation = stack.pop();
    const startLocation = stack.pop();
    const copyLength = stack.pop();

    if (typeof memoryLocation !== 'number') {
        throw new Error('expected number for memory location on codecopy');
    }

    memory[memoryLocation] = new CODECOPY(startLocation, copyLength);
};
