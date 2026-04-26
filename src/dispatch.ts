import { arrayify, hexlify } from "./bytes.ts";

/**
 * 
 */
export type OpsDef = { readonly [m: string]: { op: number, size?: number } };

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
export class Opcode {
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
     * Any byte number, _i.e._, between 0 and 255 representing the opcode byte.
     * The `opcode` may not be a valid opcode according to the decoder definition.
     */
    readonly opcode;

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
    readonly mnemonic;

    /**
     * A `Unary` opcode does not include any `data`. For these opcodes `data` is `null`.
     * 
     * If this `Opcode` is a `PUSHn` instruction or contains any operand data,
     * then it contains the data attached to this instruction.
     */
    readonly data;
    constructor(pc: number, opcode: number, mnemonic: string, data?: Uint8Array) {
        this.pc = pc;
        this.opcode = opcode;
        this.mnemonic = mnemonic;
        this.data = data;
    }

    /**
     * Where the next opcode should be located at.
     */
    get nextpc(): number {
        return this.pc + (this.data?.length ?? 0) + 1;
    }

    /**
     * Returns the hexadecimal representation of `this.data`.
     */
    hexData(): string | undefined {
        return this.data === undefined ? undefined : hexlify(this.data);
    }

    /**
     * Returns a `string` representation of `this` `Opcode`.
     * Usually used for debugging purposes.
     * 
     * @returns the `string` representation of `this` `Opcode`.
     */
    toString() {
        const pc = this.pc.toString().padStart(2, '0');
        const opcode = this.opcode.toString(16).padStart(2, '0');
        const pushData = this.data ? ` (${parseInt(this.hexData()!, 16)})` : '';
        return `${pc}: <${opcode}>${this.mnemonic}${pushData}`;
    }
}
/**
 * 
 */
export class Dispatch<T extends OpsDef> {

    /**
     * 
     */
    readonly dispatch: { size?: number, mnemonic: keyof T & string }[];

    /**
     * 
     */
    readonly def: T;

    constructor(def: T) {
        this.dispatch = Array(256).fill({ mnemonic: 'INVALID' });
        this.def = def;
        Object.assign(this.dispatch, Object.fromEntries(
            Object.entries(def).map(
                ([mnemonic, entry]) => [entry.op, { size: entry.size, mnemonic }] as const
            )
        ));
    }

    fork<U extends OpsDef>(def: U): Dispatch<T & U> {
        return new Dispatch(Object.assign({ ...this.def }, def));
    }

    *decode(bytecode: Parameters<typeof arrayify>[0], begin: number = 0) {
        const buffer = arrayify(bytecode);

        for (let pc = begin; pc < buffer.length; pc++) {
            const opcode = buffer[pc];
            const { size, mnemonic } = this.dispatch[opcode];
            yield new Opcode(
                pc,
                opcode,
                mnemonic,
                size === undefined ? undefined : (() => {
                    const data = buffer.subarray(pc + 1, pc + size + 1);
                    if (data.length !== size) {
                        const op = new Opcode(pc, opcode, mnemonic, data);
                        throw new Error(`Trying to get \`${size}\` bytes but got only \`${data.length}\` while decoding \`${op}\` before reaching the end of bytecode`);
                    }
                    pc += size;
                    return data;
                })(),
            );
        }
    }
}