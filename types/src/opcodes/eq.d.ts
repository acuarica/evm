import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class SIG {
    readonly hash: string;
    readonly name = "SIG";
    readonly type?: string;
    readonly wrapped = false;
    constructor(hash: string);
    toString(): string;
}
export declare class EQ {
    readonly left: any;
    readonly right: any;
    readonly name = "EQ";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: any, right: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
