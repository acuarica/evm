import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class BLOCKHASH {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly number: any;
    constructor(blockNumber: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
