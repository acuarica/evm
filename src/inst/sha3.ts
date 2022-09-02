import { Opcode } from '../opcode';
import { Operand, State } from '../state';
import { memArgs, stringify } from './utils';

export class Sha3 {
    readonly name = 'SHA3';
    readonly type?: string;
    readonly wrapped = false;
    readonly memoryStart?: Operand;
    readonly memoryLength?: Operand;
    readonly items?: Operand[];

    constructor(items: Operand[], memoryStart?: Operand, memoryLength?: Operand) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = items;
        }
    }

    toString() {
        if (this.items) {
            return `keccak256(${this.items.map(item => stringify(item)).join(', ')})`;
        } else {
            return `keccak256(memory[${stringify(this.memoryStart!)}:(${stringify(
                this.memoryStart!
            )}+${stringify(this.memoryLength!)})])`;
        }
    }
}

export const SHA3 = {
    SHA3: (_opcode: Opcode, state: State) => {
        // const memoryStart = stack.pop();
        // const memoryLength = stack.pop();
        memArgs(state, Sha3, state.stack.push.bind(state.stack));
        // if (typeof memoryStart === 'bigint' && typeof memoryLength === 'bigint' && memoryLength <= 1024 * 32) {
        //     const items = [];
        //     for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
        //         items.push(i in memory ? memory[i] : new MLOAD(i));
        //     }
        //     stack.push(new Sha3(items));
        // } else {
        //     stack.push(new Sha3([], memoryStart, memoryLength));
        // }
    },
};
