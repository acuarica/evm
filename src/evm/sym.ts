import type { Ram } from '../state';
import { type Expr, Tag, Val } from './ast';

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
    | 'chainid'
    | 'self.balance'
    | 'memory.length'
    | 'gasleft()';

export class Symbol0 extends Tag('Symbol0', Val.prec) {
    constructor(readonly symbol: Info, readonly type: string | undefined = undefined) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return this.symbol;
    }
}

export class Symbol1 extends Tag('Symbol1', Val.prec) {
    constructor(readonly fn: (value: string) => string, readonly value: Expr) {
        super();
    }

    eval(): Expr {
        return new Symbol1(this.fn, this.value.eval());
    }

    str(): string {
        return this.fn(this.value._str(Val.prec));
    }
}

export class DataCopy extends Tag('DataCopy', Val.prec) {
    constructor(
        readonly fn: (offset: string, size: string) => string,
        readonly offset: Expr,
        readonly size: Expr
    ) {
        super();
    }

    eval(): this {
        return this;
    }

    str(): string {
        return this.fn(this.offset.str(), this.size.str());
    }
}

export const SYM = {
    ADDRESS: symbol0('this', 'address'),
    BALANCE: symbol1(address => `${address}.balance`),
    ORIGIN: symbol0('tx.origin'),
    CALLER: symbol0('msg.sender'),
    CALLDATACOPY: datacopy((offset, size) => `msg.data[${offset}:(${offset}+${size})];`),
    CODESIZE: symbol0('this.code.length'),
    CODECOPY: datacopy((offset, size) => `this.code[${offset}:(${offset}+${size})]`),
    GASPRICE: symbol0('tx.gasprice'),
    EXTCODESIZE: symbol1(address => `address(${address}).code.length`),
    EXTCODECOPY: ({ stack }: Ram<Expr>): void => {
        const address = stack.pop();
        datacopy((offset, size) => `address(${address.str()}).code[${offset}:(${offset}+${size})]`);
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
    CHAINID: symbol0('chainid'),
    SELFBALANCE: symbol0('self.balance'),
    MSIZE: symbol0('memory.length'),
    GAS: symbol0('gasleft()'),
};

function symbol0(value: Info, type?: string) {
    return ({ stack }: Ram<Expr>) => {
        stack.push(new Symbol0(value, type));
    };
}

function symbol1(fn: (value: string) => string) {
    return ({ stack }: Ram<Expr>) => {
        const value = stack.pop();
        stack.push(new Symbol1(fn, value));
    };
}

export function datacopy(fn: (offset: string, size: string) => string) {
    return ({ stack, memory }: Ram<Expr>): void => {
        const dest = stack.pop();
        const offset = stack.pop();
        const size = stack.pop();
        if (!dest.isVal()) {
            throw new Error('expected number in returndatacopy');
        }

        memory[Number(dest.val)] = new DataCopy(fn, offset, size);
    };
}
