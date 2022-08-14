import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
export declare class GT {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;
    readonly equal: boolean;
    constructor(left: any, right: any, equal?: boolean);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
