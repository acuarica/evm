import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { MLOAD } from './mload';
import stringify from '../utils/stringify';

export class SHA3 {
    readonly name = 'SHA3';
    readonly type?: string;
    readonly wrapped = false;
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
            return 'keccak256(' + this.items.map((item: any) => stringify(item)).join(', ') + ')';
        } else {
            return (
                'keccak256(memory[' +
                stringify(this.memoryStart) +
                ':(' +
                stringify(this.memoryStart) +
                '+' +
                stringify(this.memoryLength) +
                ')])'
            );
        }
    }
}

export default (_opcode: Opcode, { stack, memory }: EVM): void => {
    const memoryStart = stack.pop();
    const memoryLength = stack.pop();
    if (typeof memoryStart === 'bigint' && typeof memoryLength === 'bigint') {
        const items = [];
        for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
            items.push(i in memory ? memory[i] : new MLOAD(i));
        }
        stack.push(new SHA3(items));
    } else {
        stack.push(new SHA3([], memoryStart, memoryLength));
    }
};
