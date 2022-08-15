import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class LOG {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items?: any;
    readonly topics: any;
    readonly eventName?: string;
    constructor(eventHashes: {
        [s: string]: string;
    }, topics: any, items?: any, memoryStart?: any, memoryLength?: any);
    toString(): string;
}
declare const _default: (opcode: Opcode, state: EVM) => void;
export default _default;
