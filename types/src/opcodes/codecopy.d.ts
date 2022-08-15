import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CODECOPY {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly startLocation: any;
    readonly copyLength: any;
    constructor(startLocation: any, copyLength: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
