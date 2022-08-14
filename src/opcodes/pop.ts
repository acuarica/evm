import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.pop();
};
