import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import * as BigNumber from '../../node_modules/big-integer';

export default (opcode: Opcode, state: EVM): void => {
    state.stack.push(BigNumber(opcode.pc));
};
