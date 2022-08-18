import opcodeFunctions from './opcodes';
import stringifyEvents from './utils/stringifyEvents';
import stringifyStructs from './utils/stringifyStructs';
import stringifyMappings from './utils/stringifyMappings';
import stringifyVariables from './utils/stringifyVariables';
import stringifyFunctions from './utils/stringifyFunctions';
import { stringifyInstructions } from './utils/stringifyInstructions';
import { Stack } from './stack';
import { Opcode } from './opcode';
import {
    STOP,
    RETURN,
    REVERT,
    INVALID,
    PUSH1,
    PUSH32,
    JUMPDEST,
    SELFDESTRUCT,
    codes,
    names,
    PUSH4,
} from './codes';
import { fromHex, toHex } from './hex';
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

type INST =
    | GT
    | LT
    | SHA3
    | Add
    | SIG
    | IsZero
    | CALL
    | Div
    | CallDataLoad
    | CALLDATACOPY
    | Return
    | Revert;

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
          type?: string;
          wrapped: boolean;
      }
    | INST;

export type Operand = bigint | Instruction;

interface Mapping {
    [key: string]: any;
}

export class EVM {
    pc = 0;
    stack = new Stack<bigint | Instruction>();
    memory: { [location: number]: Operand } = {};
    opcodes: Opcode[] = [];
    instructions: Instruction[] = [];
    jumps: any = {};
    code: Uint8Array;
    mappings: Mapping = {};
    layer = 0;
    halted = false;
    functions: { [hash: string]: TopLevelFunction } = {};
    variables: { [key: string]: Variable } = {};
    events: Event = {};
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
            for (let index = 0; index < this.code.length; index++) {
                const opcode = this.code[index];
                const currentOp = {
                    pc: index,
                    opcode,
                    name: codes[opcode as keyof typeof codes] ?? 'INVALID',
                    toString: function () {
                        const pc = this.pc.toString(16).padStart(4, '0').toUpperCase();
                        const opcode = this.opcode.toString(16).padStart(2, '0').toUpperCase();
                        const pushData = this.pushData ? ' 0x' + toHex(this.pushData) : '';

                        return `${pc}    ${opcode}    ${this.name}${pushData}`;
                    },
                } as Opcode;
                this.opcodes.push(currentOp);
                if (opcode >= PUSH1 && opcode <= PUSH32) {
                    const size = opcode - 0x5f;
                    const data = this.code.subarray(index + 1, index + size + 1);
                    currentOp.pushData = data;
                    index += size;
                }
            }
        }
        return this.opcodes;
    }

    getFunctions(): string[] {
        return [
            ...new Set(
                this.getOpcodes()
                    .filter(opcode => opcode.opcode === PUSH4)
                    .map(opcode => (opcode.pushData ? toHex(opcode.pushData) : ''))
                    .filter(hash => hash in this.functionHashes)
                    .map(hash => this.functionHashes[hash])
            ),
        ];
    }

    getEvents(): string[] {
        return [
            ...new Set(
                this.getOpcodes()
                    .filter(opcode => opcode.opcode === PUSH32)
                    .map(opcode => (opcode.pushData ? toHex(opcode.pushData) : ''))
                    .filter(hash => hash in this.eventHashes)
                    .map(hash => this.eventHashes[hash])
            ),
        ];
    }

    containsOpcode(opcode: number | string): boolean {
        let halted = false;
        if (typeof opcode === 'string' && opcode in names) {
            opcode = (names as any)[opcode];
        } else if (typeof opcode === 'string') {
            throw new Error('Invalid opcode provided');
        }
        for (let index = 0; index < this.code.length; index++) {
            const currentOpcode = this.code[index];
            if (currentOpcode === opcode && !halted) {
                return true;
            } else if (currentOpcode === JUMPDEST) {
                halted = false;
            } else if ([STOP, RETURN, REVERT, INVALID, SELFDESTRUCT].includes(currentOpcode)) {
                halted = true;
            } else if (currentOpcode >= PUSH1 && currentOpcode <= PUSH32) {
                index += currentOpcode - PUSH1 + 0x01;
            }
        }
        return false;
    }

    getJumpDestinations(): number[] {
        return this.getOpcodes()
            .filter(opcode => opcode.opcode === JUMPDEST)
            .map(opcode => opcode.pc);
    }

    getSwarmHash(): string | false {
        const regex = /a165627a7a72305820([a-f0-9]{64})0029$/;
        const bytecode = this.getBytecode();
        const match = bytecode.match(regex);
        if (match && match[1]) {
            return 'bzzr://' + match[1];
        } else {
            return false;
        }
    }

    getABI(): any {
        const abi: any = [];
        if (this.instructions.length === 0) {
            this.parse();
        }
        Object.keys(this.functions).forEach((key: string) => {
            const item: any = abi.push({ type: 'function' });
            item.name = this.functions[key].label.split('(')[0];
            item.payable = this.functions[key].payable;
            item.constant = this.functions[key].constant;
        });
    }

    reset(): void {
        this.pc = 0;
        this.instructions = [];
        this.stack.reset();
        this.memory = {};
        this.jumps = {};
        this.mappings = {};
        this.functions = {};
        this.variables = {};
        this.events = {};
        this.gasUsed = 0;
    }

    parse(): Instruction[] {
        if (this.instructions.length === 0) {
            const opcodes = this.getOpcodes();
            for (this.pc; this.pc < opcodes.length && !this.halted; this.pc++) {
                const opcode = opcodes[this.pc];
                opcodeFunctions[opcode.name as keyof typeof opcodeFunctions](opcode, this);
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
            .map((functionName: string) =>
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
