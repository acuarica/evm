/**
 * Set of `PUSHn` opcodes.
 */
declare const PUSHES: {
    PUSH1: number;
    PUSH2: number;
    PUSH3: number;
    PUSH4: number;
    PUSH5: number;
    PUSH6: number;
    PUSH7: number;
    PUSH8: number;
    PUSH9: number;
    PUSH10: number;
    PUSH11: number;
    PUSH12: number;
    PUSH13: number;
    PUSH14: number;
    PUSH15: number;
    PUSH16: number;
    PUSH17: number;
    PUSH18: number;
    PUSH19: number;
    PUSH20: number;
    PUSH21: number;
    PUSH22: number;
    PUSH23: number;
    PUSH24: number;
    PUSH25: number;
    PUSH26: number;
    PUSH27: number;
    PUSH28: number;
    PUSH29: number;
    PUSH30: number;
    PUSH31: number;
    PUSH32: number;
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
export declare const OPCODES: {
    readonly DUP1: 128;
    readonly DUP2: 129;
    readonly DUP3: 130;
    readonly DUP4: 131;
    readonly DUP5: 132;
    readonly DUP6: 133;
    readonly DUP7: 134;
    readonly DUP8: 135;
    readonly DUP9: 136;
    readonly DUP10: 137;
    readonly DUP11: 138;
    readonly DUP12: 139;
    readonly DUP13: 140;
    readonly DUP14: 141;
    readonly DUP15: 142;
    readonly DUP16: 143;
    readonly SWAP1: 144;
    readonly SWAP2: 145;
    readonly SWAP3: 146;
    readonly SWAP4: 147;
    readonly SWAP5: 148;
    readonly SWAP6: 149;
    readonly SWAP7: 150;
    readonly SWAP8: 151;
    readonly SWAP9: 152;
    readonly SWAP10: 153;
    readonly SWAP11: 154;
    readonly SWAP12: 155;
    readonly SWAP13: 156;
    readonly SWAP14: 157;
    readonly SWAP15: 158;
    readonly SWAP16: 159;
    readonly LOG0: 160;
    readonly LOG1: 161;
    readonly LOG2: 162;
    readonly LOG3: 163;
    readonly LOG4: 164;
    readonly CREATE: 240;
    readonly CALL: 241;
    readonly CALLCODE: 242;
    readonly RETURN: 243;
    readonly DELEGATECALL: 244;
    readonly CREATE2: 245;
    readonly STATICCALL: 250;
    readonly REVERT: 253;
    readonly INVALID: 254;
    readonly SELFDESTRUCT: 255;
    readonly PUSH1: number;
    readonly PUSH2: number;
    readonly PUSH3: number;
    readonly PUSH4: number;
    readonly PUSH5: number;
    readonly PUSH6: number;
    readonly PUSH7: number;
    readonly PUSH8: number;
    readonly PUSH9: number;
    readonly PUSH10: number;
    readonly PUSH11: number;
    readonly PUSH12: number;
    readonly PUSH13: number;
    readonly PUSH14: number;
    readonly PUSH15: number;
    readonly PUSH16: number;
    readonly PUSH17: number;
    readonly PUSH18: number;
    readonly PUSH19: number;
    readonly PUSH20: number;
    readonly PUSH21: number;
    readonly PUSH22: number;
    readonly PUSH23: number;
    readonly PUSH24: number;
    readonly PUSH25: number;
    readonly PUSH26: number;
    readonly PUSH27: number;
    readonly PUSH28: number;
    readonly PUSH29: number;
    readonly PUSH30: number;
    readonly PUSH31: number;
    readonly PUSH32: number;
    readonly STOP: 0;
    readonly ADD: 1;
    readonly MUL: 2;
    readonly SUB: 3;
    readonly DIV: 4;
    readonly SDIV: 5;
    readonly MOD: 6;
    readonly SMOD: 7;
    readonly ADDMOD: 8;
    readonly MULMOD: 9;
    readonly EXP: 10;
    readonly SIGNEXTEND: 11;
    readonly LT: 16;
    readonly GT: 17;
    readonly SLT: 18;
    readonly SGT: 19;
    readonly EQ: 20;
    readonly ISZERO: 21;
    readonly AND: 22;
    readonly OR: 23;
    readonly XOR: 24;
    readonly NOT: 25;
    readonly BYTE: 26;
    readonly SHL: 27;
    readonly SHR: 28;
    readonly SAR: 29;
    readonly SHA3: 32;
    readonly ADDRESS: 48;
    readonly BALANCE: 49;
    readonly ORIGIN: 50;
    readonly CALLER: 51;
    readonly CALLVALUE: 52;
    readonly CALLDATALOAD: 53;
    readonly CALLDATASIZE: 54;
    readonly CALLDATACOPY: 55;
    readonly CODESIZE: 56;
    readonly CODECOPY: 57;
    readonly GASPRICE: 58;
    readonly EXTCODESIZE: 59;
    readonly EXTCODECOPY: 60;
    readonly RETURNDATASIZE: 61;
    readonly RETURNDATACOPY: 62;
    readonly EXTCODEHASH: 63;
    readonly BLOCKHASH: 64;
    readonly COINBASE: 65;
    readonly TIMESTAMP: 66;
    readonly NUMBER: 67;
    readonly DIFFICULTY: 68;
    readonly GASLIMIT: 69;
    readonly CHAINID: 70;
    readonly SELFBALANCE: 71;
    readonly POP: 80;
    readonly MLOAD: 81;
    readonly MSTORE: 82;
    readonly MSTORE8: 83;
    readonly SLOAD: 84;
    readonly SSTORE: 85;
    readonly JUMP: 86;
    readonly JUMPI: 87;
    readonly PC: 88;
    readonly MSIZE: 89;
    readonly GAS: 90;
    readonly JUMPDEST: 91;
};
/**
 * A map from numeric opcodes to string mnemonics.
 */
export declare const MNEMONICS: {
    [k: string]: "ADDRESS" | "ORIGIN" | "CALLER" | "CODESIZE" | "GASPRICE" | "RETURNDATASIZE" | "COINBASE" | "TIMESTAMP" | "NUMBER" | "DIFFICULTY" | "GASLIMIT" | "CHAINID" | "SELFBALANCE" | "MSIZE" | "GAS" | "DUP1" | "DUP2" | "DUP3" | "DUP4" | "DUP5" | "DUP6" | "DUP7" | "DUP8" | "DUP9" | "DUP10" | "DUP11" | "DUP12" | "DUP13" | "DUP14" | "DUP15" | "DUP16" | "SWAP1" | "SWAP2" | "SWAP3" | "SWAP4" | "SWAP5" | "SWAP6" | "SWAP7" | "SWAP8" | "SWAP9" | "SWAP10" | "SWAP11" | "SWAP12" | "SWAP13" | "SWAP14" | "SWAP15" | "SWAP16" | "LOG0" | "LOG1" | "LOG2" | "LOG3" | "LOG4" | "CREATE" | "CALL" | "CALLCODE" | "RETURN" | "DELEGATECALL" | "CREATE2" | "STATICCALL" | "REVERT" | "INVALID" | "SELFDESTRUCT" | "PUSH1" | "PUSH2" | "PUSH3" | "PUSH4" | "PUSH5" | "PUSH6" | "PUSH7" | "PUSH8" | "PUSH9" | "PUSH10" | "PUSH11" | "PUSH12" | "PUSH13" | "PUSH14" | "PUSH15" | "PUSH16" | "PUSH17" | "PUSH18" | "PUSH19" | "PUSH20" | "PUSH21" | "PUSH22" | "PUSH23" | "PUSH24" | "PUSH25" | "PUSH26" | "PUSH27" | "PUSH28" | "PUSH29" | "PUSH30" | "PUSH31" | "PUSH32" | "STOP" | "ADD" | "MUL" | "SUB" | "DIV" | "SDIV" | "MOD" | "SMOD" | "ADDMOD" | "MULMOD" | "EXP" | "SIGNEXTEND" | "LT" | "GT" | "SLT" | "SGT" | "EQ" | "ISZERO" | "AND" | "OR" | "XOR" | "NOT" | "BYTE" | "SHL" | "SHR" | "SAR" | "SHA3" | "BALANCE" | "CALLVALUE" | "CALLDATALOAD" | "CALLDATASIZE" | "CALLDATACOPY" | "CODECOPY" | "EXTCODESIZE" | "EXTCODECOPY" | "RETURNDATACOPY" | "EXTCODEHASH" | "BLOCKHASH" | "POP" | "MLOAD" | "MSTORE" | "MSTORE8" | "SLOAD" | "SSTORE" | "JUMP" | "JUMPI" | "PC" | "JUMPDEST";
};
/**
 * Represents all unary opcodes defined by the EVM.
 * Essentially, all but `PUSHn` opcodes are unary opcodes.
 */
export interface Unary {
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
/**
 * Represents a `PUSHn` mnemonic augmented with its `pushData`.
 */
export interface Push {
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
/**
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
} & (Unary | Push);
/**
 * Represents the `Opcode`s found in `code`.
 *
 * @param code the buffer containing the bytecode to decode
 * @returns
 */
export declare function decode(code: Uint8Array): {
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
    jumpdests: {
        [jd: number]: number;
    };
};
export declare function formatOpcode(op: Opcode): string;
/**
 *
 * @param buffer
 * @returns
 */
export declare function toHex(buffer: Uint8Array): string;
export {};
