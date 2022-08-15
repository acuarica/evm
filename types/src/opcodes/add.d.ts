import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class ADD {
    readonly name: string;
    readonly wrapped: boolean;
    readonly left: any;
    readonly right: any;
    constructor(left: any, right: any);
    toString(): string;
    get type(): any;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
