import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CODECOPY {
    readonly startLocation: any;
    readonly copyLength: any;
    readonly name = "CODECOPY";
    readonly type?: string;
    readonly wrapped = true;
    constructor(startLocation: any, copyLength: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack, memory }: EVM) => void;
export default _default;
