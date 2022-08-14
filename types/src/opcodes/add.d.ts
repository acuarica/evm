import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
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
