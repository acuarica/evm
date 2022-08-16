import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class STOP {
    readonly name = "STOP";
    readonly type?: string;
    readonly wrapped = false;
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
