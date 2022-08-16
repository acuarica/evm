import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class GASLIMIT {
    readonly name = 'GASLIMIT';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'block.gaslimit';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new GASLIMIT());
};
