import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class CALLDATASIZE {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'msg.data.length';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new CALLDATASIZE());
};
