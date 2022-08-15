import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class EXTCODESIZE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly address: any;

    constructor(address: any) {
        this.name = 'EXTCODESIZE';
        this.wrapped = true;
        this.address = address;
    }

    toString() {
        return 'address(' + stringify(this.address) + ').code.length';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const address = state.stack.pop();
    state.stack.push(new EXTCODESIZE(address));
};
