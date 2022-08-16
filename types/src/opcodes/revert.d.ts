import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class REVERT {
    readonly name = "REVERT";
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items: any;
    constructor(items: any, memoryStart?: any, memoryLength?: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
