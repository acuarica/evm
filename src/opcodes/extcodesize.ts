import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class EXTCODESIZE {
    readonly name = 'EXTCODESIZE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly address: any) {}

    toString() {
        return 'address(' + stringify(this.address) + ').code.length';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const address = stack.pop();
    stack.push(new EXTCODESIZE(address));
};
