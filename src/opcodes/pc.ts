import { EVM } from '../evm';
import { Opcode } from '../opcode';

export default (opcode: Opcode, state: EVM): void => {
    state.stack.push(BigInt(opcode.pc));
};
