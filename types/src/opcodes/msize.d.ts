import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
export declare class MSIZE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    constructor();
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
