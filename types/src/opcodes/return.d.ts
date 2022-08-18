import { Operand } from '../evm';
export declare class Return {
    readonly items: Operand[];
    readonly name = "RETURN";
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: Operand;
    readonly memoryLength?: Operand;
    constructor(items: Operand[], memoryStart?: Operand, memoryLength?: Operand);
    toString(): string;
}
