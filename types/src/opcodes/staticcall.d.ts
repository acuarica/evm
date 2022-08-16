import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class STATICCALL {
    readonly gas: any;
    readonly address: any;
    readonly memoryStart: any;
    readonly memoryLength: any;
    readonly outputStart: any;
    readonly outputLength: any;
    readonly name = "STATICCALL";
    readonly type?: string;
    readonly wrapped = true;
    constructor(gas: any, address: any, memoryStart: any, memoryLength: any, outputStart: any, outputLength: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
