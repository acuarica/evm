import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';

export default (opcode: Opcode, state: EVM): void => {
    // const _pushDataLength = parseInt(opcode.name.replace('PUSH', ''), 10);
    state.stack.push(BigInt('0x' + opcode.pushData!.toString('hex')));
};
