import { Operand } from '../evm';
/**
 * https://www.evm.codes/#00
 */
export declare class Stop {
    readonly name = "STOP";
    readonly wrapped = false;
    toString: () => string;
}
export declare class Add {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "ADD";
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
export declare class Mul {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "MUL";
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
export declare class Sub {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "SUB";
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
export declare class Div {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "DIV";
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
export declare class Mod {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "MOD";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
export declare class Exp {
    readonly left: Operand;
    readonly right: Operand;
    readonly name = "EXP";
    readonly type?: string;
    readonly wrapped = true;
    constructor(left: Operand, right: Operand);
    toString: () => string;
}
