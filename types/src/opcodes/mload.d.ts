import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class MLOAD {
    readonly location: any;
    readonly name = "MLOAD";
    readonly type?: string;
    readonly wrapped = true;
    constructor(location: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
