import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
export declare class BALANCE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly address: any;
    constructor(address: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
