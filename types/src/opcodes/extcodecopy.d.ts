import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class EXTCODECOPY {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly address: any;
    readonly startLocation: any;
    readonly copyLength: any;
    constructor(address: any, startLocation: any, copyLength: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
