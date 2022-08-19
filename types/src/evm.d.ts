import opcodeFunctions from './opcodes';
import { Stack } from './stack';
import { Opcode } from './opcode';
import { IsZero, LT, GT } from './inst/logic';
import { SHA3 } from './opcodes/sha3';
import { Add, Div } from './inst/math';
import { SIG } from './opcodes/eq';
import { CALL } from './opcodes/call';
import { CALLDATACOPY, CallDataLoad } from './inst/info';
import { Return, Revert } from './inst/system';
import { TopLevelFunction, Variable } from './opcodes/jumpi';
interface Event {
    [key: string]: any;
}
declare type INST = GT | LT | SHA3 | Add | SIG | IsZero | CALL | Div | CallDataLoad | CALLDATACOPY | Return | Revert;
export declare type Instruction = {
    name: Exclude<keyof typeof opcodeFunctions | 'MappingStore' | 'REQUIRE' | 'MappingLoad' | 'LOG' | 'ReturnData' | 'SYMBOL', INST['name']>;
    type?: string | undefined;
    wrapped: boolean;
    toString: () => string;
} | INST;
export declare type Operand = bigint | Instruction;
interface Mapping {
    [key: string]: any;
}
export declare class EVM {
    readonly functionHashes: {
        [s: string]: string;
    };
    readonly eventHashes: {
        [s: string]: string;
    };
    pc: number;
    stack: Stack<bigint | Instruction>;
    memory: {
        [location: number]: Operand;
    };
    opcodes: Opcode[];
    instructions: Instruction[];
    jumps: any;
    code: Uint8Array;
    mappings: Mapping;
    layer: number;
    halted: boolean;
    functions: {
        [hash: string]: TopLevelFunction;
    };
    variables: {
        [key: string]: Variable;
    };
    events: Event;
    gasUsed: number;
    conditions: Instruction[];
    constructor(code: string | Uint8Array, functionHashes: {
        [s: string]: string;
    }, eventHashes: {
        [s: string]: string;
    });
    clone(): EVM;
    getBytecode(): string;
    getOpcodes(): Opcode[];
    getFunctions(): string[];
    getEvents(): string[];
    containsOpcode(opcode: number | string): boolean;
    getJumpDestinations(): number[];
    getSwarmHash(): string | false;
    getABI(): any;
    reset(): void;
    parse(): Instruction[];
    decompile(): string;
    isERC165(): boolean;
}
export {};
