import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';

export default (opcode: Opcode, state: EVM): void => {
    state.stack.push(BigInt('0x' + opcode.pushData!.toString('hex')));
};
