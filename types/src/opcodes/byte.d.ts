import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class BYTE {
    readonly position: any;
    readonly data: any;
    readonly name = "BYTE";
    readonly type?: string;
    readonly wrapped = true;
    constructor(position: any, data: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
