import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class LT {
    readonly left: any;
    readonly right: any;
    readonly equal: boolean;
    readonly name = "LT";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: any, right: any, equal?: boolean);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
