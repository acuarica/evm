import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CODESIZE {
    readonly name = "CODESIZE";
    readonly type?: string;
    readonly wrapped = false;
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
