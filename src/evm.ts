import opcodeFunctions from './opcodes';
import stringifyEvents from './utils/stringifyEvents';
import stringifyStructs from './utils/stringifyStructs';
import stringifyMappings from './utils/stringifyMappings';
import stringifyVariables from './utils/stringifyVariables';
import stringifyFunctions from './utils/stringifyFunctions';
import { stringifyInstructions } from './utils/stringifyInstructions';
import { Stack } from './stack';
import { decode, Opcode, OPCODES } from './opcode';
import { fromHex, toHex } from './hex';
import { IsZero, LT, GT, SHA3 } from './inst/logic';
import { Add, Div } from './inst/math';
import { SIG } from './opcodes/eq';
import { CALL } from './opcodes/call';
import { CallDataLoad } from './inst/info';
import { Return, Revert } from './inst/system';
import { TopLevelFunction, Variable } from './opcodes/jumpi';
import { MetadataHash, stripMetadataHash } from './metadata';

type INST = GT | LT | SHA3 | Add | SIG | IsZero | CALL | Div | CallDataLoad | Return | Revert;

export type Instruction =
    | {
          name: Exclude<
              | keyof typeof opcodeFunctions
              | 'MappingStore'
              | 'REQUIRE'
              | 'MappingLoad'
              | 'LOG'
              | 'ReturnData'
              | 'SYMBOL',
              INST['name']
          >;
          type?: string | undefined;
          wrapped: boolean;
          toString: () => string;
      }
    | INST;

export type Operand = bigint | Instruction;

export class EVM {
    pc = 0;
    stack = new Stack<bigint | Instruction>();
    memory: { [location: number]: Operand } = {};
    opcodes: Opcode[] = [];
    instructions: Instruction[] = [];
    jumps: { [label: string]: true } = {};
    code: Uint8Array;
    mappings: {
        [key: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Operand[][];
            values: Operand[];
        };
    } = {};
    layer = 0;
    halted = false;
    functions: { [hash: string]: TopLevelFunction } = {};
    variables: { [key: string]: Variable } = {};
    events: { [key: string]: { label?: string; indexedCount: number } } = {};
    gasUsed = 0;
    conditions: Instruction[] = [];

    constructor(
        code: string | Uint8Array,
        readonly functionHashes: { [s: string]: string },
        readonly eventHashes: { [s: string]: string }
    ) {
        if (code instanceof Uint8Array) {
            this.code = code;
        } else {
            this.code = fromHex(code.replace('0x', ''));
        }
    }

    clone(): EVM {
        const clone = new EVM(this.code, this.functionHashes, this.eventHashes);
        clone.pc = this.pc;
        clone.opcodes = this.opcodes;
        clone.stack = this.stack.clone();
        clone.memory = { ...this.memory };
        clone.jumps = { ...this.jumps };
        // clone.jumps = this.jumps;
        clone.mappings = this.mappings;
        clone.layer = this.layer + 1;
        clone.functions = this.functions;
        clone.variables = this.variables;
        clone.events = this.events;
        clone.gasUsed = this.gasUsed;
        clone.conditions = [...this.conditions];
        return clone;
    }

    getBytecode(): string {
        return '0x' + toHex(this.code);
    }

    getOpcodes(): Opcode[] {
        if (this.opcodes.length === 0) {
            this.opcodes = decode(this.code);
        }
        return this.opcodes;
    }

    getFunctions(): string[] {
        return [
            ...new Set(
                this.getOpcodes()
                    .filter(
                        (opcode): opcode is Opcode & { mnemonic: 'PUSH4' } =>
                            opcode.opcode === OPCODES.PUSH4
                    )
                    .map(opcode => toHex(opcode.pushData))
                    .filter(hash => hash in this.functionHashes)
                    .map(hash => this.functionHashes[hash])
            ),
        ];
    }

    getEvents(): string[] {
        return [
            ...new Set(
                this.getOpcodes()
                    .filter(
                        (opcode): opcode is Opcode & { mnemonic: 'PUSH32' } =>
                            opcode.opcode === OPCODES.PUSH32
                    )
                    .map(opcode => toHex(opcode.pushData))
                    .filter(hash => hash in this.eventHashes)
                    .map(hash => this.eventHashes[hash])
            ),
        ];
    }

    containsOpcode(opcode: number | string): boolean {
        const HALTS = [
            OPCODES.STOP,
            OPCODES.RETURN,
            OPCODES.REVERT,
            OPCODES.INVALID,
            OPCODES.SELFDESTRUCT,
        ] as number[];
        let halted = false;
        if (typeof opcode === 'string' && opcode in OPCODES) {
            opcode = OPCODES[opcode as keyof typeof OPCODES];
        } else if (typeof opcode === 'string') {
            throw new Error('Invalid opcode provided');
        }
        for (let index = 0; index < this.code.length; index++) {
            const currentOpcode = this.code[index];
            if (currentOpcode === opcode && !halted) {
                return true;
            } else if (currentOpcode === OPCODES.JUMPDEST) {
                halted = false;
            } else if (HALTS.includes(currentOpcode)) {
                halted = true;
            } else if (currentOpcode >= OPCODES.PUSH1 && currentOpcode <= OPCODES.PUSH32) {
                index += currentOpcode - OPCODES.PUSH1 + 0x01;
            }
        }
        return false;
    }

    getJumpDestinations(): number[] {
        return this.getOpcodes()
            .filter(opcode => opcode.opcode === OPCODES.JUMPDEST)
            .map(opcode => opcode.pc);
    }

    getMetadataHash(): MetadataHash | null {
        return stripMetadataHash(this.getBytecode())[1];
    }

    getABI(): any {
        const abi = [];
        if (this.instructions.length === 0) {
            this.parse();
        }
        Object.keys(this.functions).forEach(key => {
            const item: any = abi.push({ type: 'function' });
            item.name = this.functions[key].label.split('(')[0];
            item.payable = this.functions[key].payable;
            item.constant = this.functions[key].constant;
        });
    }

    parse(): Instruction[] {
        if (this.instructions.length === 0) {
            const opcodes = this.getOpcodes();
            for (this.pc; this.pc < opcodes.length && !this.halted; this.pc++) {
                const opcode = opcodes[this.pc];
                opcodeFunctions[opcode.mnemonic](opcode, this);
            }
        }
        return this.instructions;
    }

    decompile(): string {
        const instructionTree = this.parse();
        const events = stringifyEvents(this.events, this.getEvents());
        const structs = stringifyStructs(this.mappings);
        const mappings = stringifyMappings(this.mappings);
        const variables = stringifyVariables(this.variables);
        const functions = Object.keys(this.functions)
            .map(functionName =>
                stringifyFunctions(functionName, this.functions[functionName], this.functionHashes)
            )
            .join('');
        const code = stringifyInstructions(instructionTree);
        return events + structs + mappings + variables + functions + code;
    }

    isERC165(): boolean {
        return ['supportsInterface(bytes4)'].every(v => this.getFunctions().includes(v));
    }
}
