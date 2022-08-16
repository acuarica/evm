import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class BLOCKHASH {
    readonly name = 'BLOCKHASH';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly blockNumber: any) {}

    toString() {
        return 'block.blockhash(' + stringify(this.blockNumber) + ')';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const blockNumber = stack.pop();
    stack.push(new BLOCKHASH(blockNumber));
};
