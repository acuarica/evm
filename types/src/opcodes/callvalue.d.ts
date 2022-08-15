import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CALLVALUE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    constructor();
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
