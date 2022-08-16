import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class ADD {
    readonly left: any;
    readonly right: any;
    readonly name = "ADD";
    readonly wrapped = true;
    constructor(left: any, right: any);
    toString(): string;
    get type(): any;
}
declare const _default: (_opcode: Opcode, { stack }: EVM) => void;
export default _default;
