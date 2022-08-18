import { EVM, Operand } from '../evm';
import { Opcode } from '../opcode';
export declare class MappingStore {
    readonly mappings: any;
    readonly location: any;
    readonly items: any;
    readonly data: any;
    readonly count: any;
    readonly structlocation?: any;
    readonly name = "MappingStore";
    readonly type?: string;
    readonly wrapped = false;
    constructor(mappings: any, location: any, items: any, data: any, count: any, structlocation?: any);
    toString(): string;
}
export declare class SSTORE {
    readonly location: Operand;
    readonly data: any;
    readonly variables: any;
    readonly name = "SSTORE";
    readonly type?: string;
    readonly wrapped = true;
    constructor(location: Operand, data: any, variables: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
