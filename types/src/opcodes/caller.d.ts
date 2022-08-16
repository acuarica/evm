import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CALLER {
    readonly name = "CALLER";
    readonly type?: string;
    readonly wrapped = false;
    constructor();
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
