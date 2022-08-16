import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class STOP {
    readonly name = 'STOP';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'return;';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.halted = true;
    state.instructions.push(new STOP());
};
