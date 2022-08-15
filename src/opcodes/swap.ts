import { EVM } from '../evm';
import { Opcode } from '../opcode';

export default (opcode: Opcode, state: EVM): void => {
    const swapLocation = parseInt(opcode.name.replace('SWAP', ''), 10);
    state.stack.swap(swapLocation);
};
