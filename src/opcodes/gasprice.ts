import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class GASPRICE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'GASPRICE';
        this.wrapped = false;
    }

    toString() {
        return 'tx.gasprice';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new GASPRICE());
};
