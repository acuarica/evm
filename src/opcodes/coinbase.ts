import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class COINBASE {
    readonly name = 'COINBASE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'block.coinbase';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new COINBASE());
};
