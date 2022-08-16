import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class MSTORE {
    readonly name = 'MSTORE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: any, readonly data: any) {}

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
