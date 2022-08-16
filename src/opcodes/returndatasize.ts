import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class RETURNDATASIZE {
    readonly name = 'RETURNDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'output.length';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new RETURNDATASIZE());
};
