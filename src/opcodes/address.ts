import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class ADDRESS {
    readonly name = 'ADDRESS';
    readonly type: string = 'address';
    readonly wrapped = false;

    toString() {
        return 'this';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new ADDRESS());
};
