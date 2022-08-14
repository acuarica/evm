import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import stringify from '../utils/stringify';

export class MSTORE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly location: any;
    readonly data: any;

    constructor(location: any, data: any) {
        this.name = 'MSTORE';
        this.wrapped = true;
        this.location = location;
        this.data = data;
    }

    toString() {
        return 'memory[' + stringify(this.location) + '] = ' + stringify(this.data) + ';';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const storeLocation = state.stack.pop();
    const storeData = state.stack.pop();
    if (typeof storeLocation === 'bigint') {
        state.memory[Number(storeLocation)] = storeData;
    } else {
        state.instructions.push(new MSTORE(storeLocation, storeData));
    }
};
