import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class GAS {
    readonly name = 'GAS';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'gasleft()';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new GAS());
};
