import { EVM } from '../evm';
import { Opcode } from '../opcode';

export default (opcode: Opcode, state: EVM): void => {
    const duplicateLocation = parseInt(opcode.name.replace('DUP', ''), 10) - 1;
    state.stack.duplicate(duplicateLocation);
};
