import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CREATE {
    readonly name = 'CREATE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly memoryStart: any, readonly memoryLength: any, readonly value: any) {
        // this.name = 'address';
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
    state.stack.push(new CREATE(memoryStart, memoryLength, value));
};
