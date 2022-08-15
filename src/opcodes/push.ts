import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import { toHex } from '../utils/hex';

export default (opcode: Opcode, state: EVM): void => {
    state.stack.push(BigInt('0x' + toHex(opcode.pushData!)));
};
