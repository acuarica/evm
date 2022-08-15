import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class SAR {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;
    constructor(left: any, right: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
