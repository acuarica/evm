import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class STATICCALL {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly gas: any;
    readonly address: any;
    readonly memoryStart: any;
    readonly memoryLength: any;
    readonly outputStart: any;
    readonly outputLength: any;
    constructor(gas: any, address: any, memoryStart: any, memoryLength: any, outputStart: any, outputLength: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
