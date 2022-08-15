import { EVM } from '../evm';
import { Opcode } from '../opcode';
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
