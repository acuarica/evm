import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CREATE2 {
    readonly memoryStart: any;
    readonly memoryLength: any;
    readonly value: any;
    readonly name = "CREATE2";
    readonly type?: string;
    readonly wrapped = true;
    constructor(memoryStart: any, memoryLength: any, value: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
