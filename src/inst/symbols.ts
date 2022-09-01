import { Opcode } from '../opcode';
import { State } from '../state';
import stringify from '../utils/stringify';

export const SYMBOLS = {
    ADDRESS: symbol0('this', 'address'),
    BALANCE: symbol1(address => `${address}.balance`),
    ORIGIN: symbol0('tx.origin'),
    CALLER: symbol0('msg.sender'),
    CALLDATACOPY: datacopy((offset, size) => `msg.data[${offset}:(${offset}+${size})];`),
    CODESIZE: symbol0('this.code.length'),
    CODECOPY: datacopy((offset, size) => `this.code[${offset}:(${offset}+${size})]`),
    GASPRICE: symbol0('tx.gasprice'),
    EXTCODESIZE: symbol1(address => `address(${address}).code.length`),
    EXTCODECOPY: (_opcode: Opcode, { stack }: State) => {
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
    MSIZE: symbol0('memory.length'),
    GAS: symbol0('gasleft()'),
};

function symbol0(value: string, type?: string) {
    return (_opcode: Opcode, { stack }: State) => {
        stack.push({
            name: 'SYMBOL',
            type,
            wrapped: false,
            toString: () => value,
        });
    };
}

function symbol1(fn: (value: string) => string) {
    return (_opcode: Opcode, { stack }: State) => {
        const value = stack.pop();
        stack.push({
            name: 'SYMBOL',
            wrapped: false,
            toString: () => fn(stringify(value)),
        });
    };
}

export function datacopy(fn: (offset: string, size: string) => string) {
    return (_opcode: Opcode, { stack, memory }: State) => {
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
