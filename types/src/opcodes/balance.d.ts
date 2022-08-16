import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class BALANCE {
    readonly address: any;
    readonly name = "BALANCE";
    readonly type?: string;
    readonly wrapped = false;
    constructor(address: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
