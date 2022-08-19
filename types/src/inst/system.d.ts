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
export declare class Revert {
    readonly name = "REVERT";
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items: any;
    constructor(items: any, memoryStart?: any, memoryLength?: any);
    toString(): string;
}
export declare class Invalid {
    readonly opcode: any;
    readonly name = "INVALID";
    readonly type?: string;
    readonly wrapped = true;
    constructor(opcode: any);
    toString: () => string;
}
export declare class SelfDestruct {
    readonly address: any;
    readonly name = "SELFDESTRUCT";
    readonly type?: string;
    readonly wrapped = true;
    constructor(address: any);
    toString: () => string;
}
