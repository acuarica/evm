import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class CALLDATALOAD {
    readonly location: any;
    readonly name = "CALLDATALOAD";
    readonly type?: string;
    readonly returntype?: string;
    readonly wrapped = false;
    constructor(location: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
