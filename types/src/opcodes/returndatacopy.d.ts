import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class RETURNDATACOPY {
    readonly returnDataPosition: any;
    readonly returnDataSize: any;
    readonly name = "RETURNDATACOPY";
    readonly type?: string;
    readonly wrapped = true;
    constructor(returnDataPosition: any, returnDataSize: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack, memory }: EVM) => void;
export default _default;
