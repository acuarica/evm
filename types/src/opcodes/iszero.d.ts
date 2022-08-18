import { EVM, Operand } from '../evm';
import { Opcode } from '../opcode';
export declare class IsZero {
    readonly value: Operand;
    readonly name = "ISZERO";
    readonly type?: string;
    readonly wrapped = true;
    constructor(value: Operand);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
