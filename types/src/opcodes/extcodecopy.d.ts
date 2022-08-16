import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class EXTCODECOPY {
    readonly address: any;
    readonly startLocation: any;
    readonly copyLength: any;
    readonly name = "EXTCODECOPY";
    readonly type?: string;
    readonly wrapped = true;
    constructor(address: any, startLocation: any, copyLength: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack, memory }: EVM) => void;
export default _default;
