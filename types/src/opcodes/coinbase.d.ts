import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
export declare class COINBASE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    constructor();
    toString(): string;
}
declare const _default: (opcode: Opcode, state: EVM) => void;
export default _default;