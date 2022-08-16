import opcodeFunctions from './opcodes';
import { Stack } from './stack';
import { Opcode } from './opcode';
import { GT } from './opcodes/gt';
import { LT } from './opcodes/lt';
import { SHA3 } from './opcodes/sha3';
import { ADD } from './opcodes/add';
import { SIG } from './opcodes/eq';
import { ISZERO } from './opcodes/iszero';
import { CALL } from './opcodes/call';
interface Event {
    [key: string]: any;
}
declare type INST = GT | LT | SHA3 | ADD | SIG | ISZERO | CALL;
declare type Name = INST['name'];
declare type A = Exclude<keyof typeof opcodeFunctions | 'MappingStore' | 'REQUIRE' | 'SIG' | 'MappingLoad' | 'LOG', Name>;
interface Instruction2 {
    name: A;
    type?: string;
    wrapped?: boolean;
}
declare type Instruction = Instruction2 | INST;
interface Variable {
    [key: string]: any;
}
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
    stack: Stack<any>;
    memory: any;
    opcodes: Opcode[];
    instructions: Instruction[];
    storage: any;
    jumps: any;
    code: Uint8Array;
    mappings: Mapping;
    layer: number;
    halted: boolean;
    functions: any;
    variables: Variable;
    events: Event;
    gasUsed: number;
    conditions: any;
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
