import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class MSIZE {
    readonly name = 'MSIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'memory.length';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new MSIZE());
};
