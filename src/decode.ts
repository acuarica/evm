import { entries, zip, mapValues } from './lib/object.ts';
import { hexlify } from './bytes.ts';

/**
 * Represents an opcode found in the bytecode augmented with
 * offset and operand information as defined by the EVM.
 *
 * It can be either a unary opcode, _which does not take any operand data_,
 * or either a `PUSHn` mnemonic augmented with its push `data`.
 * That is, all but `PUSHn` `n >= 1` opcodes are unary opcodes.
 *
 * `PUSHn` `n >= 1` opcodes takes an `n`-byte argument from the bytecode.
 * Note that `PUSH0`[^1] does not take any data argument from the bytecode (just pushes `0` onto the `Stack`).
 * Thus it can be considered as an unary opcode.
 * 
 * [^1]: https://eips.ethereum.org/EIPS/eip-3855
 */
export interface Opcode {

    /**
     * This is the offset in the bytecode where this `Opcode` was found.
     * Both jump instructions, _i.e._, `JUMP` and `JUMPI`,
     * expects a stack operand referencing this `offset` in the bytecode.
     *
     * The Program Counter of this `Opcode`.
     * The index in the `Opcode[]` where this `Opcode` is inserted.
     */
    readonly pc: number;

    /**
     * Where the next opcode should be located at.
     */
    readonly nextpc: number;

    /**
     * A `Unary` opcode does not include any `data`. For these opcodes `data` is `null`.
     * 
     * If this `Opcode` is a `PUSHn` instruction or contains any operand data,
     * then it contains the data attached to this instruction.
     */
    readonly data?: Uint8Array;

    /**
     * Any byte number, _i.e._, between 0 and 255 representing the opcode byte.
     * The `opcode` may not be a valid opcode according to the decoder definition.
     */
    readonly op: number;

    /**
     * Represents a valid opcode.
     *
     * In https://www.evm.codes/ you can find an overview of each EVM opcode.
     *
     * If the `opcode` given is not a valid opcode,
     * you can provide `INVALID` as `mnemonic`.
     * 
     * A `PUSHn` opcode only permits a `PUSHn` opcode.
     */
    readonly mnemonic: string;
}

/**
 * 
 */
export class Dispatch<M extends string> {

    /**
     * 
     */
    readonly ops: { [mnemonic in M]: number };

    /**
     * 
     */
    readonly #opcodes: { mnemonic: M, size?: number }[];

    /**
     * 
     * @param opcodes 
     * @param invalid 
     */
    constructor(opcodes: { readonly [m in M]: { op: number, size?: number } }, invalid: NoInfer<M>) {
        this.#opcodes = Array(256).fill({ mnemonic: invalid });
        Object.assign(this.#opcodes, zip(entries(opcodes).map(
            ([mnemonic, { op, size }]) => [op, { mnemonic, size }]
        )));

        this.ops = mapValues(opcodes, entry => entry.op);
    }

    *decode(bytecode: Uint8Array, begin: number) {
        for (let pc = begin; pc < bytecode.length;) {
            const op = bytecode[pc];
            const { mnemonic, size } = this.#opcodes[op];

            let nextpc = pc + 1;
            if (size === undefined) {
                yield { pc, nextpc, op, mnemonic } satisfies Opcode;
            } else {
                const data = bytecode.subarray(pc + 1, pc + size + 1);
                if (data.length !== size) {
                    const opstr = formatOpcode({ pc, op, mnemonic, data });
                    throw new Error(`Trying to get \`${size}\` bytes but got only \`${data.length}\` while decoding \`${opstr}\` before reaching the end of bytecode`);
                }
                nextpc += size;
                yield { pc, nextpc, data, op, mnemonic } satisfies Opcode;
            }
            pc = nextpc;
        }
    }
}

/**
 * Returns a `string` representation of `Opcode`.
 * Useful for debugging purposes.
 * 
 * @returns the `string` representation of `Opcode`.
 */
export function formatOpcode({ pc, op, mnemonic, data }: Omit<Opcode, 'nextpc'>) {
    const pcstr = pc.toString().padStart(2, '0');
    const opstr = op.toString(16).padStart(2, '0');
    const datastr = data ? ` 0x${hexlify(data)}` : '';
    return `${pcstr}: <${opstr}>${mnemonic}${datastr}`;
}