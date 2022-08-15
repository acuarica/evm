import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class JUMP {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly valid: boolean;
    readonly location: any;
    constructor(location: any, bad?: boolean);
    toString(): string;
}
declare const _default: (opcode: Opcode, state: EVM) => void;
export default _default;
