import { EVM } from '../evm';
import { Opcode } from '../opcode';
export declare class NOT {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly item: any;
    constructor(item: any);
    toString(): string;
}
declare const _default: (_opcode: Opcode, state: EVM) => void;
export default _default;
