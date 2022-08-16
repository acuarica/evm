import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class ORIGIN {
    readonly name = 'ORIGIN';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'tx.origin';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new ORIGIN());
};
