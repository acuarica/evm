import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class NUMBER {
    readonly name = 'NUMBER';
    readonly type?: string;
    readonly wrapped = true;

    toString() {
        return 'block.number';
    }
}

export default (_opcode: Opcode, { stack }: EVM) => {
    stack.push(new NUMBER());
};
