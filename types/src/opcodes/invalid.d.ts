import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class INVALID {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly opcode: any;
    constructor(opcode: any);
    toString(): string;
}
declare const _default: (opcode: Opcode, state: EVM) => void;
export default _default;
