import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class RETURNDATACOPY {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly returnDataPosition: any;
    readonly returnDataSize: any;
    constructor(returnDataPosition: any, returnDataSize: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
