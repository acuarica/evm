import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class GASPRICE {
    readonly name = 'GASPRICE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'tx.gasprice';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new GASPRICE());
};
