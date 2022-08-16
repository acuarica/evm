import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class EXTCODEHASH {
    readonly address: any;
    readonly name = "EXTCODEHASH";
    readonly type?: string;
    readonly wrapped = true;
    constructor(address: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
