import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class SHA3 {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items: any;
    constructor(items: any, memoryStart?: any, memoryLength?: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
