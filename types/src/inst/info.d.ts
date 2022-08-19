import { Operand } from '../evm';
/**
 * https://www.evm.codes/#35
 */
export declare class CallDataLoad {
    readonly location: Operand;
    readonly name = "CALLDATALOAD";
    readonly type?: string;
    readonly returntype?: string;
    readonly wrapped = false;
    constructor(location: Operand);
    toString(): string;
}
export declare class CALLDATASIZE {
    readonly name = "CALLDATASIZE";
    readonly type?: string;
    readonly wrapped = false;
    toString: () => string;
}
export declare class CALLDATACOPY {
    readonly startLocation: any;
    readonly copyLength: any;
    readonly name = "CALLDATACOPY";
    readonly type?: string;
    readonly wrapped: boolean;
    constructor(startLocation: any, copyLength: any);
    toString: () => string;
}
export declare class CallValue {
    readonly name = "CALLDATASIZE";
    readonly type?: string;
    readonly wrapped = false;
    toString: () => string;
}
