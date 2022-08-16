import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class DIFFICULTY {
    readonly name = 'DIFFICULTY';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'block.difficulty';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new DIFFICULTY());
};
