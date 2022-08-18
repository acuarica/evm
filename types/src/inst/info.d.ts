import { Operand } from '../evm';
/**
 * https://www.evm.codes/#30
 */
export declare class Address {
    readonly name = "ADDRESS";
    readonly type = "address";
    readonly wrapped = false;
    toString: () => string;
}
/**
 * https://www.evm.codes/#31
 */
export declare class Balance {
    readonly address: Operand;
    readonly name = "BALANCE";
    readonly type?: string;
    readonly wrapped = false;
    constructor(address: Operand);
    toString: () => string;
}
/**
 * https://www.evm.codes/#35
 */
export declare class CallDataLoad {
    readonly location: any;
    readonly name = "CALLDATALOAD";
    readonly type?: string;
    readonly returntype?: string;
    readonly wrapped = false;
    constructor(location: any);
    toString(): string;
}
export declare class CALLDATASIZE {
    readonly name = "CALLDATASIZE";
    readonly type?: string;
    readonly wrapped = false;
    toString(): string;
}
export declare class CallValue {
    readonly name = "CALLDATASIZE";
    readonly type?: string;
    readonly wrapped = false;
    toString(): string;
}
