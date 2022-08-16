import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class MOD {
    readonly left: any;
    readonly right: any;
    readonly name = "MOD";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: any, right: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
