import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { MLOAD } from './mload';
import stringify from '../utils/stringify';

export class REVERT {
    readonly name = 'REVERT';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items: any;

    constructor(items: any, memoryStart?: any, memoryLength?: any) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = items;
        }
    }

    toString() {
        if (this.items) {
            return 'revert(' + this.items.map((item: any) => stringify(item)).join(', ') + ');';
        } else {
            return (
                'revert(memory[' +
                stringify(this.memoryStart) +
                ':(' +
                stringify(this.memoryStart) +
                '+' +
                stringify(this.memoryLength) +
                ')]);'
            );
        }
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const memoryStart = state.stack.pop();
    const memoryLength = state.stack.pop();
    state.halted = true;
    if (typeof memoryStart === 'bigint' && typeof memoryLength === 'bigint') {
        const items = [];
        for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
            if (i in state.memory) {
                items.push(state.memory[i]);
            } else {
                items.push(new MLOAD(i));
            }
        }
        state.instructions.push(new REVERT(items));
    } else {
        state.instructions.push(new REVERT([], memoryStart, memoryLength));
    }
};
