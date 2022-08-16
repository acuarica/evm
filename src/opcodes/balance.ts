import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class BALANCE {
    readonly name = 'BALANCE';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly address: any) {}

    toString() {
        return stringify(this.address) + '.balance';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const address = stack.pop();
    stack.push(new BALANCE(address));
};
