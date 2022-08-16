import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class INVALID {
    readonly name = 'INVALID';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly opcode: any) {}

    toString() {
        return 'revert("Invalid instruction (0x' + this.opcode.toString(16) + ')");';
    }
}

export default (opcode: Opcode, state: EVM): void => {
    state.halted = true;
    state.instructions.push(new INVALID(opcode.opcode));
};
