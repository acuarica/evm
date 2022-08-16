import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class MUL {
    readonly left: any;
    readonly right: any;
    readonly name = "MUL";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: any, right: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
