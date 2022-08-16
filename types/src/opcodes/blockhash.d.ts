import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class BLOCKHASH {
    readonly blockNumber: any;
    readonly name = "BLOCKHASH";
    readonly type?: string;
    readonly wrapped = true;
    constructor(blockNumber: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
