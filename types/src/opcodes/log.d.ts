import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
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
