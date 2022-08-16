import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class CALLER {
    readonly name = 'CALLER';
    readonly type?: string;
    readonly wrapped = false;

    constructor() {
        this.name = 'CALLER';
    }

    toString() {
        return 'msg.sender';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new CALLER());
};
