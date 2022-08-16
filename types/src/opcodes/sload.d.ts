import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class MappingLoad {
    readonly mappings: any;
    readonly location: any;
    readonly items: any;
    readonly count: any;
    readonly structlocation?: any;
    readonly name = "MappingLoad";
    readonly type?: string;
    readonly wrapped = false;
    constructor(mappings: any, location: any, items: any, count: any, structlocation?: any);
    toString(): string;
}
export declare class SLOAD {
    readonly location: any;
    readonly variables: any;
    readonly name = "SLOAD";
    readonly type?: string;
    readonly wrapped = false;
    constructor(location: any, variables: any);
    toString(): any;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
