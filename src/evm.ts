import stringifyEvents from './utils/stringifyEvents';
import stringifyStructs from './utils/stringifyStructs';
import stringifyMappings from './utils/stringifyMappings';
import stringifyVariables from './utils/stringifyVariables';
import stringifyFunctions from './utils/stringifyFunctions';
import { stringifyBlocks } from './utils/stringifyInstructions';
import { decode, Opcode, OPCODES } from './opcode';
import { fromHex, toHex } from './hex';
import { TopLevelFunction, Variable } from './inst/jumps';
import { MetadataHash, stripMetadataHash } from './metadata';
import { ControlFlowGraph, getBlocks } from './cfg';
import { Operand } from './state';

/**
 *
 */
export class EVM {
    /**
     *
     */
    readonly code: string;

    /**
     *
     */
    readonly metadataHash: MetadataHash | null;

    /**
     *
     */
    readonly opcodes: Opcode[];

    mappings: {
        [key: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Operand[][];
            values: Operand[];
        };
    } = {};
    functions: { [hash: string]: TopLevelFunction } = {};
    variables: { [key: string]: Variable } = {};
    events: { [key: string]: { label?: string; indexedCount: number } } = {};

    constructor(
        bytecode: string,
        readonly functionHashes: { [s: string]: string },
        readonly eventHashes: { [s: string]: string }
    ) {
        const [code, metadataHash] = stripMetadataHash(bytecode);
        this.code = code;
        this.metadataHash = metadataHash;

        this.opcodes = decode(fromHex(code.replace('0x', '')));
    }

    getBlocks(): ControlFlowGraph {
        return getBlocks(this);
    }

    getFunctions(): string[] {
        return [
            ...new Set(
                this.opcodes
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
                this.opcodes
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

    getABI(): any {
        const abi = [];
        Object.keys(this.functions).forEach(key => {
            const item: any = abi.push({ type: 'function' });
            item.name = this.functions[key].label.split('(')[0];
            item.payable = this.functions[key].payable;
            item.constant = this.functions[key].constant;
        });
    }

    decompile(): string {
        const blocks = this.getBlocks();

        const events = stringifyEvents(this.events, this.getEvents());
        const structs = stringifyStructs(this.mappings);
        const mappings = stringifyMappings(this.mappings);
        const variables = stringifyVariables(this.variables);
        const functions = Object.keys(this.functions)
            .map(functionName =>
                stringifyFunctions(functionName, this.functions[functionName], this.functionHashes)
            )
            .join('');
        const code = stringifyBlocks(blocks, this.functionHashes);
        return events + structs + mappings + variables + functions + code;
    }

    isERC165(): boolean {
        return ['supportsInterface(bytes4)'].every(v => this.getFunctions().includes(v));
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
        const code = fromHex(this.code.replace('0x', ''));
        for (let index = 0; index < code.length; index++) {
            const currentOpcode = code[index];
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
}
