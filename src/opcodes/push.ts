import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { toHex } from '../hex';

export default (opcode: Opcode, state: EVM): void => {
    state.stack.push(BigInt('0x' + toHex(opcode.pushData!)));
};
