import { Opcode } from '../opcode';
import { State } from '../state';
import { stringify } from './utils';

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

export type Info =
    | 'this'
    | 'tx.origin'
    | 'msg.sender'
    | 'this.code.length'
    | 'tx.gasprice'
    | 'output.length'
    | 'block.coinbase'
    | 'block.timestamp'
    | 'block.number'
    | 'block.difficulty'
    | 'block.gaslimit'
    | 'memory.length'
    | 'gasleft()';

export class Symbol0 {
    readonly wrapped = false;
    constructor(readonly symbol: Info, readonly type?: string) {}
    toString() {
        return this.symbol;
    }
}

function symbol0(value: Info, type?: string) {
    return (_opcode: Opcode, { stack }: State) => {
        stack.push(new Symbol0(value, type));
    };
}

function symbol1(fn: (value: string) => string) {
    return (_opcode: Opcode, { stack }: State) => {
        const value = stack.pop();
        stack.push(
            new (class {
                readonly wrapped = false;
                toString() {
                    return fn(stringify(value));
                }
            })()
        );
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
        memory[dest as any] = new (class {
            wrapped = false;
            toString() {
                return fn(stringify(offset), stringify(size));
            }
        })();
    };
}
