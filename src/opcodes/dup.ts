import { EVM } from '../evm';
import { Opcode } from '../opcode';

export default (position: number) => {
    return (_opcode: Opcode, { stack }: EVM): void => {
        stack.dup(position);
    };
};
