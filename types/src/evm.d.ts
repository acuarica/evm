import { Stack } from './stack';
import { Opcode } from './opcode';
interface Event {
    [key: string]: any;
}
interface Instruction {
    name: string;
    type?: string;
    wrapped?: boolean;
}
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
