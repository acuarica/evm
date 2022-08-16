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
import XOR from './xor';
import NOT from './not';
import BYTE from './byte';
import SHL from './shl';
import SHR from './shr';
import SAR from './sar';
import SHA3 from './sha3';
import ADDRESS from './address';
import BALANCE from './balance';
import ORIGIN from './origin';
import CALLER from './caller';
import CALLVALUE from './callvalue';
import CALLDATALOAD from './calldataload';
import CALLDATASIZE from './calldatasize';
import CALLDATACOPY from './calldatacopy';
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
import NUMBER from './number';
import DIFFICULTY from './difficulty';
import GASLIMIT from './gaslimit';
import POP from './pop';
import MLOAD from './mload';
import MSTORE from './mstore';
import SLOAD from './sload';
import SSTORE from './sstore';
import JUMP from './jump';
import JUMPI from './jumpi';
import PC from './pc';
import MSIZE from './msize';
import GAS from './gas';
import JUMPDEST from './jumpdest';
import PUSH from './push';
import DUP from './dup';
import SWAP from './swap';
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
    XOR,
    NOT,
    BYTE,
    SHL,
    SHR,
    SAR,
    SHA3,
    ADDRESS,
    BALANCE,
    ORIGIN,
    CALLER,
    CALLVALUE,
    CALLDATALOAD,
    CALLDATASIZE,
    CALLDATACOPY,
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
    NUMBER,
    DIFFICULTY,
    GASLIMIT,
    POP,
    MLOAD,
    MSTORE,
    MSTORE8: MSTORE,
    SLOAD,
    SSTORE,
    JUMP,
    JUMPI,
    PC,
    MSIZE,
    GAS,
    JUMPDEST,
    PUSH1: PUSH,
    PUSH2: PUSH,
    PUSH3: PUSH,
    PUSH4: PUSH,
    PUSH5: PUSH,
    PUSH6: PUSH,
    PUSH7: PUSH,
    PUSH8: PUSH,
    PUSH9: PUSH,
    PUSH10: PUSH,
    PUSH11: PUSH,
    PUSH12: PUSH,
    PUSH13: PUSH,
    PUSH14: PUSH,
    PUSH15: PUSH,
    PUSH16: PUSH,
    PUSH17: PUSH,
    PUSH18: PUSH,
    PUSH19: PUSH,
    PUSH20: PUSH,
    PUSH21: PUSH,
    PUSH22: PUSH,
    PUSH23: PUSH,
    PUSH24: PUSH,
    PUSH25: PUSH,
    PUSH26: PUSH,
    PUSH27: PUSH,
    PUSH28: PUSH,
    PUSH29: PUSH,
    PUSH30: PUSH,
    PUSH31: PUSH,
    PUSH32: PUSH,
    DUP1: DUP(0),
    DUP2: DUP(1),
    DUP3: DUP(2),
    DUP4: DUP(3),
    DUP5: DUP(4),
    DUP6: DUP(5),
    DUP7: DUP(6),
    DUP8: DUP(7),
    DUP9: DUP(8),
    DUP10: DUP(9),
    DUP11: DUP(10),
    DUP12: DUP(11),
    DUP13: DUP(12),
    DUP14: DUP(13),
    DUP15: DUP(14),
    DUP16: DUP(15),
    SWAP1: SWAP,
    SWAP2: SWAP,
    SWAP3: SWAP,
    SWAP4: SWAP,
    SWAP5: SWAP,
    SWAP6: SWAP,
    SWAP7: SWAP,
    SWAP8: SWAP,
    SWAP9: SWAP,
    SWAP10: SWAP,
    SWAP11: SWAP,
    SWAP12: SWAP,
    SWAP13: SWAP,
    SWAP14: SWAP,
    SWAP15: SWAP,
    SWAP16: SWAP,
    LOG0: LOG,
    LOG1: LOG,
    LOG2: LOG,
    LOG3: LOG,
    LOG4: LOG,
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
