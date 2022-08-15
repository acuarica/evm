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
} from './codes';
import { fromHex, toHex } from './hex';

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

export class EVM {
    pc = 0;
    stack = new Stack<any>();
    memory: any = {};
    opcodes: Opcode[] = [];
    instructions: Instruction[] = [];
    storage: any = {};
    jumps: any = {};
    code: Uint8Array;
    mappings: Mapping = {};
    layer = 0;
    halted = false;
    functions: any = {};
    variables: Variable = {};
    events: Event = {};
    gasUsed = 0;
    conditions: any = [];

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
        clone.storage = this.storage;
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
                const currentOp: Opcode = {
                    pc: index,
                    opcode: this.code[index],
                    name: 'INVALID',
                };
                if (currentOp.opcode in codes) {
                    currentOp.name = codes[currentOp.opcode as keyof typeof codes];
                }
                this.opcodes.push(currentOp);
                if (currentOp.name.startsWith('PUSH')) {
                    const pushDataLength = this.code[index] - 0x5f;
                    const pushData = this.code.subarray(index + 1, index + pushDataLength + 1);
                    currentOp.pushData = pushData;
                    index += pushDataLength;
                }
            }
        }
        return this.opcodes;
    }

    getFunctions(): string[] {
        return [
            ...new Set(
                this.getOpcodes()
                    .filter(opcode => opcode.name === 'PUSH4')
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
                    .filter(opcode => opcode.name === 'PUSH32')
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
            .filter(opcode => opcode.name === 'JUMPDEST')
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
        this.storage = {};
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
                if (opcode.name in opcodeFunctions) {
                    opcodeFunctions[opcode.name as keyof typeof opcodeFunctions](opcode, this);
                } else {
                    throw new Error('Unknown OPCODE: ' + opcode.name);
                }
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
