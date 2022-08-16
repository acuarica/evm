import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class GAS {
    readonly name = "GAS";
    readonly type?: string;
    readonly wrapped = false;
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
