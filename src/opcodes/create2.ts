import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CREATE2 {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly memoryStart: any;
    readonly memoryLength: any;
    readonly value: any;

    constructor(memoryStart: any, memoryLength: any, value: any) {
        this.name = 'CREATE2';
        this.wrapped = true;
        this.memoryStart = memoryStart;
        this.memoryLength = memoryLength;
        this.value = value;
    }

    toString() {
        return (
            '(new Contract(memory[' +
            stringify(this.memoryStart) +
            ':(' +
            stringify(this.memoryStart) +
            '+' +
            stringify(this.memoryLength) +
            ')]).value(' +
            stringify(this.value) +
            ')).address'
        );
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const value = state.stack.pop();
    const memoryStart = state.stack.pop();
    const memoryLength = state.stack.pop();
    state.stack.push(new CREATE2(memoryStart, memoryLength, value));
};
