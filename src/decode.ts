import { arrayify, hexlify } from './bytes.ts';

/**
 * This module is used to `decode` bytecode into `Opcode`.
 * 
 * Maps numeric opcodes (byte between `0` and `255`) to decode configuration and string mnemonic.
 * That is, for the given `opcode`, 
 * `size` indicates the size of the `opcode`'s operand to consume from bytecode in bytes.
 * `halts` indicates where the step associated with this `opcode` should `halt` the EVM `State`.
 * `mnemonic` indicates the step the `EVM` should execute.
 */
export class Opcodes<M extends string = 'UNDEF'> {

    /**
     * 
     */
    #opcodes: { size: number, mnemonic: M }[];

    /**
     * 
     */
    constructor() {
        this.#opcodes = [...Array(256).keys()].map(() => ({ size: 0, mnemonic: 'UNDEF' as M }));

        Object.assign(this,
            Object.fromEntries([...Array(256).keys()].map(k => [k, [0, 'UNDEF']]))
        );
        this.Opcode.prototype._decode = this;
    }

    /**
     * 
     * @param k 
     * @returns 
     */
    build<N extends string>(k: { readonly [k in N]: number | { opcode: number, size: number } }): Opcodes<M | N> {
        const vals = new Set(Object.values(k));
        if (vals.size !== Object.entries(k).length)
            throw new Error('duplicate opcode');

        const xs = Object.entries(k).map(([mnemonic, b]) => typeof b === 'number' ? [b, { size: 0, mnemonic }] : [b.opcode, { size: b.size, mnemonic }]);
        Object.assign(this.#opcodes, Object.fromEntries(xs));

        // TODO: review
        return this as Opcodes<M | N>;
    }

    /**
     * Retrieves the opcodes by mnemonic.
     */
    get opcodes(): { readonly [m in M]: number } {
        return Object.fromEntries([...Array(256).keys()]
            .map(o => [this.#opcodes[o].mnemonic, o] as const)
            .filter(([mnemonic,]) => mnemonic !== 'UNDEF')
        );
    }

    /**
     * Decodes the input `bytecode` into `Opcode`s.
     * `bytecode` may be a hexadecimal string,
     * which may or may not begin with the hex prefix `0x`.
     *
     * ### Example
     *
     * ```typescript
     * const opcodes = [...this.decode('0x6003600501')];
     * ```
     *
     * @param bytecode hexadecimal string or array of numbers containing the bytecode to decode.
     * @param begin the byte position where to start decoding the `input` bytecode,
     * defaults to `0` if not provided.
     * @returns a generator of the decoded `Opcode`s found in `bytecode`.
     */
    // *decode(bytecode: Parameters<typeof arrayify>[0], begin = 0): Generator<this['Opcode'], void, unknown> {
    *decode(bytecode: Parameters<typeof arrayify>[0], begin = 0) {
        const buffer = arrayify(bytecode);

        for (let pc = begin; pc < buffer.length; pc++) {
            const opcode = buffer[pc];
            const { size, mnemonic } = this.#opcodes[opcode];
            yield new this.Opcode(
                pc,
                mnemonic,
                size === 0 ? null : (() => {
                    const data = buffer.subarray(pc + 1, pc + size + 1);
                    if (data.length !== size) {
                        const op = new this.Opcode(pc, mnemonic, data).format(false);
                        throw new Error(`Trying to get \`${size}\` bytes but got only \`${data.length}\` while decoding \`${op}\` before reaching the end of bytecode`);
                    }
                    pc += size;
                    return data;
                })(),
            );
        }
    }

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
    Opcode = class {

        /**
         * 
         */
        _decode!: Opcodes<M>;

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
         * Represents a valid opcode.
         *
         * In https://www.evm.codes/ you can find an overview of each EVM opcode.
         *
         * If the `opcode` given is not a valid opcode,
         * you can provide `INVALID` as `mnemonic`.
         * 
         * A `PUSHn` opcode only permits a `PUSHn` opcode.
         */
        readonly mnemonic: M;

        /**
         * A `Unary` opcode does not include any `data`. For these opcodes `data` is `null`.
         * 
         * If this `Opcode` is a `PUSHn` instruction or contains any operand data,
         * then it contains the data attached to this instruction.
         */
        readonly data: null | Uint8Array = null;

        constructor(pc: number, mnemonic: M, data: null | Uint8Array = null) {
            this.pc = pc;
            this.mnemonic = mnemonic;
            this.data = data;
        }

        /**
         * Any byte number, _i.e._, between 0 and 255 representing the opcode byte.
         * The `opcode` may not be a valid opcode.
         */
        get opcode(): number {
            return this._decode.opcodes[this.mnemonic];
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
            return this.data === null ? undefined : hexlify(this.data);
        }

        /**
         * Returns a `string` representation of `this` `Opcode`.
         * Usually used for debugging purposes.
         * 
         * @param includeDataAsNumeric whether to include `data` as numeric.
         * @returns the `string` representation of `this` `Opcode`.
         */
        format(includeDataAsNumeric = true): string {
            const pushData = this.data
                ? ` 0x${this.hexData()}` + (includeDataAsNumeric
                    ? ` (${parseInt(this.hexData()!, 16)})`
                    : '')
                : '';

            return `${this.mnemonic}(0x${this.opcode.toString(16)})@${this.pc}${pushData}`;
        }
    }
}