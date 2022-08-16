import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class MSTORE {
    readonly location: any;
    readonly data: any;
    readonly name = "MSTORE";
    readonly type?: string;
    readonly wrapped = true;
    constructor(location: any, data: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
