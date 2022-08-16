import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class SELFDESTRUCT {
    readonly address: any;
    readonly name = "SELFDESTRUCT";
    readonly type?: string;
    readonly wrapped = true;
    constructor(address: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
