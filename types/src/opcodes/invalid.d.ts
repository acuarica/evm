import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class INVALID {
    readonly opcode: any;
    readonly name = "INVALID";
    readonly type?: string;
    readonly wrapped = true;
    constructor(opcode: any);
    toString(): string;
}
declare const _default: (opcode: Opcode, state: EVM) => void;
export default _default;
