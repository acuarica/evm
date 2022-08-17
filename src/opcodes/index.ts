import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { toHex } from '../hex';

import STOP from './stop';
import ADD from './add';
import MUL from './mul';
import SUB from './sub';
import DIV from './div';
import MOD from './mod';
import ADDMOD from './addmod';
import MULMOD from './mulmod';
import EXP from './exp';
import SIGNEXTEND from './signextend';
import LT from './lt';
import GT from './gt';
import EQ from './eq';
import ISZERO from './iszero';
import AND from './and';
import OR from './or';
import NOT from './not';
import BYTE from './byte';
import SHL from './shl';
import SHR from './shr';
import SAR from './sar';
import SHA3 from './sha3';
import { ADDRESS } from './address';
import BALANCE from './balance';
import ORIGIN from './origin';
import CALLER from './caller';
import CALLVALUE from './callvalue';
import { CALLDATALOAD } from './calldataload';
import { CALLDATASIZE } from './calldatasize';
import { CALLDATACOPY } from './calldatacopy';
import CODESIZE from './codesize';
import CODECOPY from './codecopy';
import GASPRICE from './gasprice';
import EXTCODESIZE from './extcodesize';
import EXTCODECOPY from './extcodecopy';
import RETURNDATASIZE from './returndatasize';
import RETURNDATACOPY from './returndatacopy';
import EXTCODEHASH from './extcodehash';
import BLOCKHASH from './blockhash';
import COINBASE from './coinbase';
import TIMESTAMP from './timestamp';
import { NUMBER } from './number';
import { DIFFICULTY } from './difficulty';
import GASLIMIT from './gaslimit';
import { MLOAD } from './mload';
import { MSTORE } from './mstore';
import SLOAD from './sload';
import SSTORE from './sstore';
import JUMP from './jump';
import JUMPI from './jumpi';
import MSIZE from './msize';
import GAS from './gas';
import LOG from './log';
import CREATE from './create';
import CALL from './call';
import CALLCODE from './callcode';
import RETURN from './return';
import DELEGATECALL from './delegatecall';
import CREATE2 from './create2';
import STATICCALL from './staticcall';
import REVERT from './revert';
import INVALID from './invalid';
import SELFDESTRUCT from './selfdestruct';
import { XOR } from './xor';

export default {
    STOP,
    ADD,
    MUL,
    SUB,
    DIV,
    SDIV: DIV,
    MOD,
    SMOD: MOD,
    ADDMOD,
    MULMOD,
    EXP,
    SIGNEXTEND,
    LT,
    GT,
    SLT: LT,
    SGT: GT,
    EQ,
    ISZERO,
    AND,
    OR,
    XOR: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            typeof left === 'bigint' && typeof right === 'bigint'
                ? left ^ right
                : new XOR(left, right)
        );
    },
    NOT,
    BYTE,
    SHL,
    SHR,
    SAR,
    SHA3,
    ADDRESS: (_opcode: Opcode, { stack }: EVM) => {
        stack.push(new ADDRESS());
    },
    BALANCE,
    ORIGIN,
    CALLER,
    CALLVALUE,
    CALLDATALOAD: (_opcode: Opcode, { stack }: EVM) => {
        const location = stack.pop();
        stack.push(new CALLDATALOAD(location));
    },
    CALLDATASIZE: (_opcode: Opcode, { stack }: EVM) => {
        stack.push(new CALLDATASIZE());
    },
    CALLDATACOPY: (_opcode: Opcode, { stack, memory }: EVM) => {
        const memoryLocation = stack.pop();
        const startLocation = stack.pop();
        const copyLength = stack.pop();
        if (typeof memoryLocation !== 'number') {
            throw new Error('expected number in returndatacopy');
        }
        memory[memoryLocation] = new CALLDATACOPY(startLocation, copyLength);
    },
    CODESIZE,
    CODECOPY,
    GASPRICE,
    EXTCODESIZE,
    EXTCODECOPY,
    RETURNDATASIZE,
    RETURNDATACOPY,
    EXTCODEHASH,
    BLOCKHASH,
    COINBASE,
    TIMESTAMP,
    NUMBER: (_opcode: Opcode, { stack }: EVM) => {
        stack.push(new NUMBER());
    },
    DIFFICULTY: (_opcode: Opcode, { stack }: EVM) => {
        stack.push(new DIFFICULTY());
    },
    GASLIMIT,
    POP: (_opcode: Opcode, { stack }: EVM) => {
        stack.pop();
    },
    MLOAD: (_opcode: Opcode, { stack, memory }: EVM) => {
        const memoryLocation = stack.pop();
        stack.push(
            typeof memoryLocation === 'bigint' && Number(memoryLocation) in memory
                ? memory[Number(memoryLocation)]
                : new MLOAD(memoryLocation)
        );
    },
    MSTORE: mstore,
    MSTORE8: mstore,
    SLOAD,
    SSTORE,
    JUMP,
    JUMPI,
    PC: (opcode: Opcode, { stack }: EVM) => {
        stack.push(BigInt(opcode.pc));
    },
    MSIZE,
    GAS,
    JUMPDEST: (_opcode: Opcode, _state: EVM) => {
        /* Empty */
    },
    PUSH1: push,
    PUSH2: push,
    PUSH3: push,
    PUSH4: push,
    PUSH5: push,
    PUSH6: push,
    PUSH7: push,
    PUSH8: push,
    PUSH9: push,
    PUSH10: push,
    PUSH11: push,
    PUSH12: push,
    PUSH13: push,
    PUSH14: push,
    PUSH15: push,
    PUSH16: push,
    PUSH17: push,
    PUSH18: push,
    PUSH19: push,
    PUSH20: push,
    PUSH21: push,
    PUSH22: push,
    PUSH23: push,
    PUSH24: push,
    PUSH25: push,
    PUSH26: push,
    PUSH27: push,
    PUSH28: push,
    PUSH29: push,
    PUSH30: push,
    PUSH31: push,
    PUSH32: push,
    DUP1: dup(0),
    DUP2: dup(1),
    DUP3: dup(2),
    DUP4: dup(3),
    DUP5: dup(4),
    DUP6: dup(5),
    DUP7: dup(6),
    DUP8: dup(7),
    DUP9: dup(8),
    DUP10: dup(9),
    DUP11: dup(10),
    DUP12: dup(11),
    DUP13: dup(12),
    DUP14: dup(13),
    DUP15: dup(14),
    DUP16: dup(15),
    SWAP1: swap(1),
    SWAP2: swap(2),
    SWAP3: swap(3),
    SWAP4: swap(4),
    SWAP5: swap(5),
    SWAP6: swap(6),
    SWAP7: swap(7),
    SWAP8: swap(8),
    SWAP9: swap(9),
    SWAP10: swap(10),
    SWAP11: swap(11),
    SWAP12: swap(12),
    SWAP13: swap(13),
    SWAP14: swap(14),
    SWAP15: swap(15),
    SWAP16: swap(16),
    LOG0: LOG(0),
    LOG1: LOG(1),
    LOG2: LOG(2),
    LOG3: LOG(3),
    LOG4: LOG(4),
    CREATE,
    CALL,
    CALLCODE,
    RETURN,
    DELEGATECALL,
    CREATE2,
    STATICCALL,
    REVERT,
    INVALID,
    SELFDESTRUCT,
};

function push(opcode: Opcode, { stack }: EVM) {
    stack.push(BigInt('0x' + toHex(opcode.pushData!)));
}

function dup(position: number) {
    return (_opcode: Opcode, { stack }: EVM): void => {
        stack.dup(position);
    };
}

function swap(position: number) {
    return (_opcode: Opcode, { stack }: EVM): void => {
        stack.swap(position);
    };
}

function mstore(_opcode: Opcode, { stack, memory, instructions }: EVM) {
    const storeLocation = stack.pop();
    const storeData = stack.pop();
    if (typeof storeLocation === 'bigint') {
        memory[Number(storeLocation)] = storeData;
    } else {
        instructions.push(new MSTORE(storeLocation, storeData));
    }
}
