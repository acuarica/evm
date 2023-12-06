/**
 * This module is used to `decode` bytecode into `Opcode`.
 *
 * ### Example
 *
 * ```typescript
 * const { opcodes } = decode('0x6003600501');
 * ```
 *
 * @packageDocumentation
 */

/**
 * Set of `PUSHn` opcodes.
 *
 * Keep track of `PUSH0` https://eips.ethereum.org/EIPS/eip-3855
 */
export const PUSHES = {
    PUSH1: 0x60,
    PUSH2: 0x61,
    PUSH3: 0x62,
    PUSH4: 0x63,
    PUSH5: 0x64,
    PUSH6: 0x65,
    PUSH7: 0x66,
    PUSH8: 0x67,
    PUSH9: 0x68,
    PUSH10: 0x69,
    PUSH11: 0x6a,
    PUSH12: 0x6b,
    PUSH13: 0x6c,
    PUSH14: 0x6d,
    PUSH15: 0x6e,
    PUSH16: 0x6f,
    PUSH17: 0x70,
    PUSH18: 0x71,
    PUSH19: 0x72,
    PUSH20: 0x73,
    PUSH21: 0x74,
    PUSH22: 0x75,
    PUSH23: 0x76,
    PUSH24: 0x77,
    PUSH25: 0x78,
    PUSH26: 0x79,
    PUSH27: 0x7a,
    PUSH28: 0x7b,
    PUSH29: 0x7c,
    PUSH30: 0x7d,
    PUSH31: 0x7e,
    PUSH32: 0x7f,
};

/**
 * Set of opcodes defined by the EVM.
 *
 * They are constructed from two kinds of opcodes.
 * `Unary` opcodes which takes no-arguments and,
 * `PUSHn` opcodes which takes an `n` byte argument from the bytecode.
 *
 * From these two different categories is easier to distinguish between the two.
 */
export const OPCODES = {
    STOP: 0x00,
    ADD: 0x01,
    MUL: 0x02,
    SUB: 0x03,
    DIV: 0x04,
    SDIV: 0x05,
    MOD: 0x06,
    SMOD: 0x07,
    ADDMOD: 0x08,
    MULMOD: 0x09,
    EXP: 0x0a,
    SIGNEXTEND: 0x0b,
    LT: 0x10,
    GT: 0x11,
    SLT: 0x12,
    SGT: 0x13,
    EQ: 0x14,
    ISZERO: 0x15,
    AND: 0x16,
    OR: 0x17,
    XOR: 0x18,
    NOT: 0x19,
    BYTE: 0x1a,
    SHL: 0x1b,
    SHR: 0x1c,
    SAR: 0x1d,
    SHA3: 0x20,
    ADDRESS: 0x30,
    BALANCE: 0x31,
    ORIGIN: 0x32,
    CALLER: 0x33,
    CALLVALUE: 0x34,
    CALLDATALOAD: 0x35,
    CALLDATASIZE: 0x36,
    CALLDATACOPY: 0x37,
    CODESIZE: 0x38,
    CODECOPY: 0x39,
    GASPRICE: 0x3a,
    EXTCODESIZE: 0x3b,
    EXTCODECOPY: 0x3c,
    RETURNDATASIZE: 0x3d,
    RETURNDATACOPY: 0x3e,
    EXTCODEHASH: 0x3f,
    BLOCKHASH: 0x40,
    COINBASE: 0x41,
    TIMESTAMP: 0x42,
    NUMBER: 0x43,
    DIFFICULTY: 0x44,
    GASLIMIT: 0x45,
    CHAINID: 0x46, // https://www.evm.codes/#46
    SELFBALANCE: 0x47, // https://www.evm.codes/#47
    /**
     * https://eips.ethereum.org/EIPS/eip-3198
     */
    BASEFEE: 0x48,
    POP: 0x50,
    MLOAD: 0x51,
    MSTORE: 0x52,
    MSTORE8: 0x53,
    SLOAD: 0x54,
    SSTORE: 0x55,
    JUMP: 0x56,
    JUMPI: 0x57,
    PC: 0x58,
    MSIZE: 0x59,
    GAS: 0x5a,

    /**
     * Keep track of https://eips.ethereum.org/EIPS/eip-4200
     */
    JUMPDEST: 0x5b,

    ...PUSHES,
    DUP1: 0x80,
    DUP2: 0x81,
    DUP3: 0x82,
    DUP4: 0x83,
    DUP5: 0x84,
    DUP6: 0x85,
    DUP7: 0x86,
    DUP8: 0x87,
    DUP9: 0x88,
    DUP10: 0x89,
    DUP11: 0x8a,
    DUP12: 0x8b,
    DUP13: 0x8c,
    DUP14: 0x8d,
    DUP15: 0x8e,
    DUP16: 0x8f,
    SWAP1: 0x90,
    SWAP2: 0x91,
    SWAP3: 0x92,
    SWAP4: 0x93,
    SWAP5: 0x94,
    SWAP6: 0x95,
    SWAP7: 0x96,
    SWAP8: 0x97,
    SWAP9: 0x98,
    SWAP10: 0x99,
    SWAP11: 0x9a,
    SWAP12: 0x9b,
    SWAP13: 0x9c,
    SWAP14: 0x9d,
    SWAP15: 0x9e,
    SWAP16: 0x9f,
    LOG0: 0xa0,
    LOG1: 0xa1,
    LOG2: 0xa2,
    LOG3: 0xa3,
    LOG4: 0xa4,
    CREATE: 0xf0,
    CALL: 0xf1,
    CALLCODE: 0xf2,
    RETURN: 0xf3,
    DELEGATECALL: 0xf4,
    CREATE2: 0xf5,
    STATICCALL: 0xfa,
    REVERT: 0xfd,
    INVALID: 0xfe,

    /**
     * Keep track of https://eips.ethereum.org/EIPS/eip-6780
     */
    SELFDESTRUCT: 0xff,
} as const;

/**
 * A map from numeric opcodes to string mnemonics.
 */
export const MNEMONICS = Object.fromEntries(
    Object.entries(OPCODES).map(([key, value]) => [value, key])
);

/**
 * Represents an opcode found in the bytecode augmented with
 * offset and operand information as defined by the EVM.
 *
 * It can be either a unary opcode, _which does not take any operand data_,
 * or either a `PUSHn` mnemonic augmented with its `pushData`.
 * That is, all but `PUSHn` `n >= 1` opcodes are unary opcodes.
 *
 */
export type Opcode = {
    /**
     * This is the offset in the bytecode where this `Opcode` was found.
     * Both jump instructions, _i.e._, `JUMP` and `JUMPI`,
     * expects a stack operand referencing this `offset` in the bytecode.
     */
    readonly offset: number;

    /**
     * The Program Counter of this `Opcode`.
     * The index in the `Opcode[]` where this `Opcode` is inserted.
     */
    readonly pc: number;

    /**
     * Any byte number, _i.e._, between 0 and 255 representing the opcode byte.
     * The `opcode` may not be a valid opcode.
     */
    readonly opcode: number;
} & (
    | {
          /**
           * Represents a valid opcode.
           *
           * In https://www.evm.codes/ you can find an overview of each EVM opcode.
           *
           * If the `opcode` given is not a valid opcode,
           * you can provide `INVALID` as `mnemonic`.
           */
          mnemonic: Exclude<keyof typeof OPCODES, keyof typeof PUSHES>;

          /**
           * A `Unary` opcode does not include any `pushData`.
           */
          pushData: null;
      }
    | {
          /**
           * A `PUSHn` opcode only permits a `PUSHn` opcode.
           */
          mnemonic: keyof typeof PUSHES;

          /**
           * If this `Opcode` is a `PUSHn` instruction,
           * then `pushData` contains the data attached to this instruction.
           * Otherwise, `null`.
           */
          pushData: Uint8Array;
      }
);

/**
 * Represents an `Error` that occurs during decoding.
 */
export class DecodeError extends Error {
    /**
     * @param message The error message.
     * @param position The position in the bytecode where the error occurred.
     */
    constructor(message: string, readonly position?: number) {
        super(message + (position !== undefined ? ` at ${position}` : ''));
        this.name = 'DecodeError';
    }
}

/**
 * Decodes the hexadecimal string `code` into `Opcode`s.
 * `code` may or may not begin with hex prefix `0x`.
 *
 * ### Example
 *
 * ```typescript
 * const { opcodes } = decode('0x6003600501');
 * ```
 *
 * @param code the hexadecimal string containing the bytecode to decode.
 * @returns
 */
export function decode(code: string): {
    /**
     * Represents the `Opcode`s found in `code`.
     */
    opcodes: Opcode[];
    /**
     * Map between `JUMPDEST` instructions offset, _i.e._,
     * as they appear in the `code` buffer and its index in the `opcodes` array.
     *
     * It allows to quickly find the `JUMPDEST` instruction.
     */
    jumpdests: { [jd: number]: number };
} {
    const isPush = (mnemonic: keyof typeof OPCODES): mnemonic is keyof typeof PUSHES =>
        mnemonic in PUSHES;

    const opcodes: Opcode[] = [];
    const jumpdests: { [jd: number]: number } = {};

    if (code.length % 2 !== 0) {
        throw new DecodeError('Unable to decode, input should have even length');
    }

    const start = code.slice(0, 2) === '0x' ? 2 : 0;
    const buffer = fromHexString(code, start);
    for (let i = 0; i < buffer.length; i++) {
        const opcode = buffer[i];
        const mnemonic = MNEMONICS[opcode] ?? 'INVALID';
        if (mnemonic === 'JUMPDEST') {
            jumpdests[i] = opcodes.length;
        }
        opcodes.push({
            offset: i,
            pc: opcodes.length,
            opcode,
            ...(isPush(mnemonic)
                ? {
                      mnemonic,
                      pushData: (() => {
                          const pushSize = opcode - OPCODES.PUSH1 + 0x01;
                          const data = buffer.subarray(i + 1, i + pushSize + 1);
                          i += pushSize;
                          return data;
                      })(),
                  }
                : {
                      mnemonic,
                      pushData: null,
                  }),
        });
    }

    return { opcodes, jumpdests };
}

/**
 * @param hexstr the hexadecimal string to convert to `Uint8Array`
 * @param start the index in `hexstr` where to start decoding.
 * @returns the `Uint8Array` representation of `hexstr`
 */
export function fromHexString(hexstr: string, start: number): Uint8Array {
    const buffer = new Uint8Array((hexstr.length - start) / 2);
    for (let i = start, j = 0; i < hexstr.length; i += 2, j++) {
        const value = parseInt(hexstr.slice(i, i + 2), 16);
        if (value >= 0) {
            buffer[j] = value;
        } else {
            throw new DecodeError(`Unable to decode, invalid value found`, i);
        }
    }
    return buffer;
}

export function formatOpcode(op: Opcode): string {
    const offset = op.offset.toString().padStart(4, ' ').toUpperCase();
    const pc = op.pc.toString().padStart(4, ' ').toUpperCase();
    const pushData = op.pushData
        ? ` 0x${toHex(op.pushData)} (${parseInt(toHex(op.pushData), 16)})`
        : '';

    return `${pc}:${offset}    ${op.mnemonic}${pushData}`;
}

/**
 *
 * @param buffer
 * @returns
 */
export function toHex(buffer: Uint8Array): string {
    return buffer.reduce((str, elem) => str + elem.toString(16).padStart(2, '0'), '');
}
