import { Operand } from '../evm';
export declare class GT {
    readonly left: any;
    readonly right: any;
    readonly equal: boolean;
    readonly name = "GT";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: any, right: any, equal?: boolean);
    toString(): string;
}
export declare class LT {
    readonly left: any;
    readonly right: any;
    readonly equal: boolean;
    readonly name = "LT";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: any, right: any, equal?: boolean);
    toString(): string;
}
/**
 * https://www.evm.codes/#18
 */
export declare class Xor {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "XOR";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
/**
 * https://www.evm.codes/#19
 */
export declare class Not {
    readonly value: Operand;
    readonly name = "NOT";
    readonly wrapped = true;
    constructor(value: Operand);
    toString: () => string;
}
/**
 * https://www.evm.codes/#1a
 */
export declare class Byte {
    readonly position: Operand;
    readonly data: Operand;
    readonly name = "BYTE";
    readonly type?: string;
    readonly wrapped = true;
    constructor(position: Operand, data: Operand);
    toString: () => string;
}
/**
 * https://www.evm.codes/#1b
 */
export declare class Shl {
    readonly value: Operand;
    readonly shift: Operand;
    readonly name = "SHL";
    readonly type?: string;
    readonly wrapped: boolean;
    constructor(value: Operand, shift: Operand);
    toString: () => string;
}
/**
 * https://www.evm.codes/#1c
 */
export declare class Shr {
    readonly value: Operand;
    readonly shift: Operand;
    readonly name = "SHR";
    readonly wrapped = true;
    constructor(value: Operand, shift: Operand);
    toString: () => string;
}
/**
 * https://www.evm.codes/#1d
 */
export declare class Sar {
    readonly value: Operand;
    readonly shift: Operand;
    readonly name = "SAR";
    readonly wrapped = true;
    constructor(value: Operand, shift: Operand);
    toString: () => string;
}
