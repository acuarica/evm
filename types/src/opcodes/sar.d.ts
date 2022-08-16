import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class SAR {
    readonly value: any;
    readonly shift: any;
    readonly name = "SAR";
    readonly type?: string;
    readonly wrapped = true;
    constructor(value: any, shift: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
