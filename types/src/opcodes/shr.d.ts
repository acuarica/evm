import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class SHR {
    readonly value: any;
    readonly shift: any;
    readonly name = "SHR";
    readonly type?: string;
    readonly wrapped = true;
    constructor(value: any, shift: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
