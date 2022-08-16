import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class TIMESTAMP {
    readonly name = 'TIMESTAMP';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'block.timestamp';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new TIMESTAMP());
};
