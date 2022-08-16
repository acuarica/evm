import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class CALLDATACOPY {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly startLocation: any;
    readonly copyLength: any;

    constructor(startLocation: any, copyLength: any) {
        this.name = 'CALLDATACOPY';
        this.wrapped = true;
        this.startLocation = startLocation;
        this.copyLength = copyLength;
    }

    toString() {
        return (
            'msg.data[' +
            this.startLocation +
            ':(' +
            this.startLocation +
            '+' +
            this.copyLength +
            ')];'
        );
    }
}

export default (_opcode: Opcode, { stack, memory }: EVM): void => {
    const memoryLocation = stack.pop();
    const startLocation = stack.pop();
    const copyLength = stack.pop();

    if (typeof memoryLocation !== 'number') {
        throw new Error('expected number in returndatacopy');
    }

    memory[memoryLocation] = new CALLDATACOPY(startLocation, copyLength);
};
