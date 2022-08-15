import { EVM } from '../evm';
import { Opcode } from '../opcode';

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.pop();
};
