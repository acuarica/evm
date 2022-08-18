import { EVM, Operand } from '../evm';
import { Opcode } from '../opcode';
export declare class SIG {
    readonly hash: string;
    readonly name = "SIG";
    readonly wrapped = false;
    constructor(hash: string);
    toString: () => string;
}
export declare class EQ {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "EQ";
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
