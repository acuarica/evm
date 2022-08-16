import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class ADDRESS {
    readonly name = "ADDRESS";
    readonly type: string;
    readonly wrapped = false;
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
