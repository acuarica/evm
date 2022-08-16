import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class NOT {
    readonly item: any;
    readonly name = "NOT";
    readonly type?: string;
    readonly wrapped = true;
    constructor(item: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
