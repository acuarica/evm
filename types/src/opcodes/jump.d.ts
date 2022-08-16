import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class JUMP {
    readonly location: any;
    readonly name = "JUMP";
    readonly type?: string;
    readonly wrapped: boolean;
    readonly valid: boolean;
    constructor(location: any, bad?: boolean);
    toString(): string;
}
declare const _default: (opcode: Opcode, state: EVM) => void;
export default _default;
