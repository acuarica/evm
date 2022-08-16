import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CREATE2 {
    readonly name = 'CREATE2';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly memoryStart: any, readonly memoryLength: any, readonly value: any) {}

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

export default (_opcode: Opcode, { stack }: EVM): void => {
    const value = stack.pop();
    const memoryStart = stack.pop();
    const memoryLength = stack.pop();
    stack.push(new CREATE2(memoryStart, memoryLength, value));
};
