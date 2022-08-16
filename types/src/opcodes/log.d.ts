import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class LOG {
    readonly topics: any;
    readonly name = "LOG";
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items?: any;
    readonly eventName?: string;
    constructor(eventHashes: {
        [s: string]: string;
    }, topics: any, items?: any, memoryStart?: any, memoryLength?: any);
    toString(): string;
}
declare const _default: (topicsCount: number) => (_opcode: Opcode, state: EVM) => void;
export default _default;
