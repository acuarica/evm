import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class BALANCE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly address: any;

    constructor(address: any) {
        this.name = 'BALANCE';
        this.wrapped = false;
        this.address = address;
    }

    toString() {
        return stringify(this.address) + '.balance';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    const address = state.stack.pop();
    state.stack.push(new BALANCE(address));
};
