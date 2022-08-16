import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CALLVALUE {
    readonly name = "CALLVALUE";
    readonly type?: string;
    readonly wrapped: boolean;
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
