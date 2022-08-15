import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CODECOPY {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly startLocation: any;
    readonly copyLength: any;

    constructor(startLocation: any, copyLength: any) {
        this.name = 'CODECOPY';
        this.wrapped = true;
        this.startLocation = startLocation;
        this.copyLength = copyLength;
    }

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

export default (_opcode: Opcode, state: EVM): void => {
    const memoryLocation = state.stack.pop();
    const startLocation = state.stack.pop();
    const copyLength = state.stack.pop();
    state.memory[memoryLocation] = new CODECOPY(startLocation, copyLength);
};
