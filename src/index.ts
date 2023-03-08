export { Stack, State } from './state';
export { Metadata, stripMetadataHash } from './metadata';
export * from './opcode';
export * as inst from './inst';
export * as ast from './ast';

import { decode, type Opcode, OPCODES } from './opcode';
import { toHex } from './opcode';
import { type Metadata, stripMetadataHash } from './metadata';
import { Contract } from './contract';
import { stringify } from './stringify';

/**
 *
 */
export class EVM {
    /**
     * The `code` part from the `bytecode`.
     * That is, the `bytecode` without its metadata hash, if any.
     */
    readonly code: string;

    /**
     * The `metadataHash` part from the `bytecode`.
     * That is, if present, the `bytecode` without its `code`.
     */
    readonly metadata: Metadata | null;

    /**
     * The `Opcode[]` decoded from `bytecode`.
     */
    readonly opcodes: Opcode[];

    /**
     *
     */
    private _contract: Contract | null = null;

    /**
     *
     * @param bytecode
     * @param functionHashes
     * @param eventHashes
     */
    constructor(
        bytecode: string,
        readonly functionHashes: { [s: string]: string },
        readonly eventHashes: { [s: string]: string }
    ) {
        const [code, metadata] = stripMetadataHash(bytecode);
        this.code = code;
        this.metadata = metadata;

        this.opcodes = decode(fromHex(code.replace('0x', '')));
    }

    /**
     *
     * @returns
     */
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

    /**
     *
     * @returns
     */
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

    /**
     *
     * @returns
     */
    get contract(): Contract {
        if (!this._contract) {
            this._contract = new Contract(this.opcodes, this.functionHashes, this.eventHashes);
        }
        return this._contract;
    }

    /**
     *
     * @returns
     */
    getABI() {
        return Object.values(this.contract).map(fn => {
            return {
                type: 'function',
                name: fn.label.split('(')[0],
                payable: fn.payable,
                constant: fn.constant,
            };
        });
    }

    decompile(): string {
        return stringify(this.contract, this.getEvents());
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

/**
 *
 * @param str
 * @returns
 */
function fromHex(str: string): Uint8Array {
    const buffer = new Uint8Array(str.length / 2);
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = parseInt(str.substr(i * 2, 2), 16);
    }

    return buffer;
}
