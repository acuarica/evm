import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class MSTORE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly location: any;
    readonly data: any;
    constructor(location: any, data: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
