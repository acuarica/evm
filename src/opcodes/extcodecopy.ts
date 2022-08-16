import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class EXTCODECOPY {
    readonly name = 'EXTCODECOPY';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly address: any, readonly startLocation: any, readonly copyLength: any) {}

    toString() {
        return (
            'address(' +
            stringify(this.address) +
            ').code[' +
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
    const address = stack.pop();
    const memoryLocation = stack.pop();
    const startLocation = stack.pop();
    const copyLength = stack.pop();

    if (typeof memoryLocation !== 'number') {
        throw new Error('expected number extcodecopy');
    }

    memory[memoryLocation] = new EXTCODECOPY(address, startLocation, copyLength);
};
