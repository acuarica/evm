import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class CODESIZE {
    readonly name = 'CODESIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'this.code.length';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new CODESIZE());
};
