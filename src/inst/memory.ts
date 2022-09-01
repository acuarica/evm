import { Opcode } from '../opcode';
import { isBigInt } from './core';
import { State } from '../state';
import stringify from '../utils/stringify';

export class MLOAD {
    readonly name = 'MLOAD';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: any) {}

    toString() {
        return 'memory[' + stringify(this.location) + ']';
    }
}

export class MSTORE {
    readonly name = 'MSTORE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: any, readonly data: any) {}

    toString() {
        return 'memory[' + stringify(this.location) + '] = ' + stringify(this.data) + ';';
    }
}

export const MEMORY = {
    MLOAD: (_opcode: Opcode, { stack, memory }: State) => {
        const memoryLocation = stack.pop();
        stack.push(
            isBigInt(memoryLocation) && Number(memoryLocation) in memory
                ? memory[Number(memoryLocation)]
                : new MLOAD(memoryLocation)
        );
    },
    MSTORE: mstore,
    MSTORE8: mstore,
};

function mstore(_opcode: Opcode, { stack, memory, stmts }: State) {
    const storeLocation = stack.pop();
    const storeData = stack.pop();
    if (isBigInt(storeLocation)) {
        memory[Number(storeLocation)] = storeData;
    } else {
        stmts.push(new MSTORE(storeLocation, storeData));
    }
}
