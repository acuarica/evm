import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class SELFDESTRUCT {
    readonly name = 'SELFDESTRUCT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly address: any) {}

    toString() {
        return 'selfdestruct(' + stringify(this.address) + ');';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const address = state.stack.pop();
    state.halted = true;
    state.instructions.push(new SELFDESTRUCT(address));
};
