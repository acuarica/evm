import { EVM, Instruction, Operand } from '../evm';
import { Opcode } from '../opcode';
export declare class TopLevelFunction {
    readonly items: Instruction[];
    readonly hash: string;
    readonly gasUsed: number;
    readonly label: string;
    readonly payable: boolean;
    readonly visibility: string;
    readonly constant: boolean;
    readonly returns: any;
    constructor(items: Instruction[], hash: string, gasUsed: number, functionHashes: {
        [s: string]: string;
    });
}
export declare class Variable {
    label: string | undefined;
    readonly types: any[];
    constructor(label: string | undefined, types: any[]);
}
export declare class Require {
    readonly condition: Operand;
    readonly name = "REQUIRE";
    readonly type?: string;
    readonly wrapped: boolean;
    constructor(condition: Operand);
    toString(): string;
}
export declare class JUMPI {
    readonly condition: any;
    readonly location: any;
    readonly name = "JUMPI";
    readonly wrapped = true;
    readonly valid: boolean;
    readonly true?: any;
    readonly false?: any;
    readonly payable?: boolean;
    constructor(condition: any, location: any, ifTrue?: any, ifFalse?: any, skipped?: boolean);
    toString(): string;
}
declare const _default: (opcode: Opcode, state: EVM) => void;
export default _default;
