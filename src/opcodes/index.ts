import { EVM, Operand } from '../evm';
import { Opcode } from '../opcode';
import { toHex } from '../hex';

import { Stop, Add, Mul, Sub, Div, Mod, Exp } from '../inst/math';
import { OR, LT, GT, Xor, Not, Byte, Shl, Shr, Sar, IsZero, SHA3 } from '../inst/logic';
import { CallDataLoad, CALLDATASIZE, CallValue } from '../inst/info';
import {
    Return,
    Revert,
    Invalid,
    SelfDestruct,
    STATICCALL,
    CREATE,
    CREATE2,
    CALLCODE,
    DELEGATECALL,
} from '../inst/system';
import { MLOAD, MSTORE } from '../inst/memory';

import EQ from './eq';
import AND from './and';
import SLOAD from './sload';
import SSTORE from './sstore';
import JUMP from './jump';
import JUMPI from './jumpi';
import LOG from './log';
import CALL from './call';
import stringify from '../utils/stringify';

export default {
    // Stop and Arithmetic Operations (since Frontier)
    STOP: (_opcode: Opcode, state: EVM) => {
        state.halted = true;
        state.instructions.push(new Stop());
    },
    ADD: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? left + right
                : isBigInt(left) && left === 0n
                ? right
                : isBigInt(right) && right === 0n
                ? left
                : new Add(left, right)
        );
    },
    MUL: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? left * right
                : (isBigInt(left) && left === 0n) || (isBigInt(right) && right === 0n)
                ? 0n
                : new Mul(left, right)
        );
    },
    SUB: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left - right : new Sub(left, right));
    },
    DIV: div,
    SDIV: div,
    MOD: mod,
    SMOD: mod,
    ADDMOD: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        const mod = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right) && isBigInt(mod)
                ? (left + right) % mod
                : isBigInt(left) && isBigInt(right)
                ? new Mod(left + right, mod)
                : new Mod(new Add(left, right), mod)
        );
    },
    MULMOD: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        const mod = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right) && isBigInt(mod)
                ? (left * right) % mod
                : isBigInt(left) && isBigInt(right)
                ? new Mod(left * right, mod)
                : new Mod(new Mul(left, right), mod)
        );
    },
    EXP: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left ** right : new Exp(left, right));
    },
    SIGNEXTEND: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(
            isBigInt(left) && isBigInt(right)
                ? (right << (32n - left)) >> (32n - left)
                : isBigInt(left)
                ? new Sar(new Shl(right, 32n - left), 32n - left)
                : new Sar(new Shl(right, new Sub(32n, left)), new Sub(32n, left))
        );
    },

    // Comparison & Bitwise Logic Operations (since Constantinople)
    LT: lt,
    GT: gt,
    SLT: lt,
    SGT: gt,
    EQ,
    ISZERO: (_opcode: Opcode, { stack }: EVM) => {
        const value = stack.pop();
        stack.push(
            isBigInt(value)
                ? value === 0n
                    ? 1n
                    : 0n
                : value.name === 'LT'
                ? new GT(value.left, value.right, !value.equal)
                : value.name === 'GT'
                ? new LT(value.left, value.right, !value.equal)
                : value instanceof IsZero
                ? value.value
                : new IsZero(value)
        );
    },
    AND,
    OR: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left | right : new OR(left, right));
    },
    XOR: (_opcode: Opcode, { stack }: EVM) => {
        const left = stack.pop();
        const right = stack.pop();
        stack.push(isBigInt(left) && isBigInt(right) ? left ^ right : new Xor(left, right));
    },
    NOT: (_opcode: Opcode, { stack }: EVM) => {
        const value = stack.pop();
        stack.push(isBigInt(value) ? ~value : new Not(value));
    },
    BYTE: (_opcode: Opcode, { stack }: EVM) => {
        const position = stack.pop();
        const data = stack.pop();
        stack.push(
            isBigInt(data) && isBigInt(position)
                ? (data >> position) & 1n
                : new Byte(position, data)
        );
    },
    SHL: (_opcode: Opcode, { stack }: EVM) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value << shift : new Shl(value, shift));
    },
    SHR: (_opcode: Opcode, { stack }: EVM) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Shr(value, shift));
    },
    SAR: (_opcode: Opcode, { stack }: EVM) => {
        const shift = stack.pop();
        const value = stack.pop();
        stack.push(isBigInt(value) && isBigInt(shift) ? value >> shift : new Sar(value, shift));
    },

    // Group SHA3
    SHA3: (_opcode: Opcode, { stack, memory }: EVM) => {
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        if (typeof memoryStart === 'bigint' && typeof memoryLength === 'bigint') {
            const items = [];
            for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
                items.push(i in memory ? memory[i] : new MLOAD(i));
            }
            stack.push(new SHA3(items));
        } else {
            stack.push(new SHA3([], memoryStart, memoryLength));
        }
    },

    // Environmental Information (since Frontier)
    ADDRESS: symbol0('this', 'address'),
    BALANCE: symbol1(address => `${address}.balance`),
    ORIGIN: symbol0('tx.origin'),
    CALLER: symbol0('msg.sender'),
    CALLVALUE: (_opcode: Opcode, { stack }: EVM) => {
        stack.push(new CallValue());
    },
    CALLDATALOAD: (_opcode: Opcode, { stack }: EVM) => {
        const location = stack.pop();
        stack.push(new CallDataLoad(location));
    },
    CALLDATASIZE: (_opcode: Opcode, { stack }: EVM) => {
        stack.push(new CALLDATASIZE());
    },
    CALLDATACOPY: datacopy((offset, size) => `msg.data[${offset}:(${offset}+${size})];`),
    CODESIZE: symbol0('this.code.length'),
    CODECOPY: datacopy((offset, size) => `this.code[${offset}:(${offset}+${size})]`),
    GASPRICE: symbol0('tx.gasprice'),
    EXTCODESIZE: symbol1(address => `address(${address}).code.length`),
    EXTCODECOPY: (_opcode: Opcode, { stack }: EVM) => {
        const address = stack.pop();
        datacopy(
            (offset, size) => `address(${stringify(address)}).code[${offset}:(${offset}+${size})]`
        );
    },
    RETURNDATASIZE: symbol0('output.length'),
    RETURNDATACOPY: datacopy((offset, size) => `output[${offset}:(${offset}+${size})]`),
    EXTCODEHASH: symbol1(address => `keccak256(address(${address}).code)`),

    // Block Information
    BLOCKHASH: symbol1(blockNumber => `blockhash(${blockNumber})`),
    COINBASE: symbol0('block.coinbase'),
    TIMESTAMP: symbol0('block.timestamp'),
    NUMBER: symbol0('block.number'),
    DIFFICULTY: symbol0('block.difficulty'),
    GASLIMIT: symbol0('block.gaslimit'),

    POP: (_opcode: Opcode, { stack }: EVM) => {
        stack.pop();
    },
    MLOAD: (_opcode: Opcode, { stack, memory }: EVM) => {
        const memoryLocation = stack.pop();
        stack.push(
            isBigInt(memoryLocation) && Number(memoryLocation) in memory
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
    MSIZE: symbol0('memory.length'),
    GAS: symbol0('gasleft()'),
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
    CREATE: (_opcode: Opcode, { stack }: EVM) => {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new CREATE(memoryStart, memoryLength, value));
    },
    CALL,
    CALLCODE: (_opcode: Opcode, { stack }: EVM) => {
        const gas = stack.pop();
        const address = stack.pop();
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();

        stack.push(
            new CALLCODE(gas, address, value, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    RETURN: (_opcode: Opcode, state: EVM) => {
        const memoryStart = state.stack.pop();
        const memoryLength = state.stack.pop();
        state.halted = true;
        if (isBigInt(memoryStart) && isBigInt(memoryLength)) {
            const items = [];
            for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
                items.push(i in state.memory ? state.memory[i] : new MLOAD(i));
            }
            state.instructions.push(new Return(items));
        } else {
            state.instructions.push(new Return([], memoryStart, memoryLength));
        }
    },
    DELEGATECALL: (_opcode: Opcode, { stack }: EVM) => {
        const gas = stack.pop();
        const address = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new DELEGATECALL(gas, address, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    CREATE2: (_opcode: Opcode, { stack }: EVM) => {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new CREATE2(memoryStart, memoryLength, value));
    },
    STATICCALL: (_opcode: Opcode, { stack }: EVM) => {
        const gas = stack.pop();
        const address = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new STATICCALL(gas, address, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    REVERT: (_opcode: Opcode, state: EVM) => {
        const memoryStart = state.stack.pop();
        const memoryLength = state.stack.pop();
        state.halted = true;
        if (isBigInt(memoryStart) && isBigInt(memoryLength)) {
            const items = [];
            for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
                items.push(i in state.memory ? state.memory[i] : new MLOAD(i));
            }
            state.instructions.push(new Revert(items));
        } else {
            state.instructions.push(new Revert([], memoryStart, memoryLength));
        }
    },
    INVALID: (opcode: Opcode, state: EVM) => {
        state.halted = true;
        state.instructions.push(new Invalid(opcode.opcode));
    },
    SELFDESTRUCT: (_opcode: Opcode, state: EVM) => {
        const address = state.stack.pop();
        state.halted = true;
        state.instructions.push(new SelfDestruct(address));
    },
};

function symbol0(value: string, type?: string) {
    return (_opcode: Opcode, { stack }: EVM) => {
        stack.push({
            name: 'SYMBOL',
            type,
            wrapped: false,
            toString: () => value,
        });
    };
}

function symbol1(fn: (value: string) => string) {
    return (_opcode: Opcode, { stack }: EVM) => {
        const value = stack.pop();
        stack.push({
            name: 'SYMBOL',
            wrapped: false,
            toString: () => fn(stringify(value)),
        });
    };
}

function div(_opcode: Opcode, { stack }: EVM) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(
        isBigInt(left) && isBigInt(right)
            ? right === 0n
                ? new Div(left, right)
                : left / right
            : isBigInt(right) && right === 1n
            ? left
            : new Div(left, right)
    );
}

function mod(_opcode: Opcode, { stack }: EVM) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? left % right : new Mod(left, right));
}

function lt(_opcode: Opcode, { stack }: EVM) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left < right ? 1n : 0n) : new LT(left, right));
}

function gt(_opcode: Opcode, { stack }: EVM) {
    const left = stack.pop();
    const right = stack.pop();
    stack.push(isBigInt(left) && isBigInt(right) ? (left > right ? 1n : 0n) : new GT(left, right));
}

export function datacopy(fn: (offset: string, size: string) => string) {
    return (_opcode: Opcode, { stack, memory }: EVM) => {
        const dest = stack.pop();
        const offset = stack.pop();
        const size = stack.pop();
        if (typeof dest !== 'number') {
            // throw new Error('expected number in returndatacopy');
        }
        memory[dest as any] = {
            name: 'SYMBOL',
            wrapped: false,
            toString: () => fn(stringify(offset), stringify(size)),
        };
    };
}

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
    if (isBigInt(storeLocation)) {
        memory[Number(storeLocation)] = storeData;
    } else {
        instructions.push(new MSTORE(storeLocation, storeData));
    }
}

function isBigInt(value: Operand): value is bigint {
    return typeof value === 'bigint';
}
