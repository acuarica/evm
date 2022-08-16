import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class SHL {
    readonly value: any;
    readonly shift: any;
    readonly name = "SHL";
    readonly type?: string;
    readonly wrapped: boolean;
    constructor(value: any, shift: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
