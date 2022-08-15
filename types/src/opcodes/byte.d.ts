import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class BYTE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly position: any;
    readonly data: any;
    constructor(position: any, data: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
