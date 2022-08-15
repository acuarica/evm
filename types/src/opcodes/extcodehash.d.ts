import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class EXTCODEHASH {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly address: any;
    constructor(address: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
