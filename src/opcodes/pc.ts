import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';

export default (opcode: Opcode, state: EVM): void => {
    state.stack.push(BigInt(opcode.pc));
};
