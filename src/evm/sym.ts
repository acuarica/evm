import { mapValues } from '../object';
import type { Ram } from '../state';
import { type Expr, Tag, Val } from './expr';

/**
 * https://docs.soliditylang.org/en/develop/units-and-global-variables.html#special-variables-and-functions
 */
const INFO = {
    ADDRESS: ['address(this)', 'address'],
    ORIGIN: ['tx.origin', 'address'],
    CALLER: ['msg.sender', 'address'],
    CODESIZE: ['codesize()', 'uint'],
    GASPRICE: ['tx.gasprice', 'uint'],
    RETURNDATASIZE: ['returndatasize()', 'uint'],
    COINBASE: ['block.coinbase', 'address payable'],
    TIMESTAMP: ['block.timestamp', 'uint'],
    NUMBER: ['block.number', 'uint'],
    DIFFICULTY: ['block.difficulty', 'uint'],
    GASLIMIT: ['block.gaslimit', 'uint'],
    CHAINID: ['block.chainid', 'uint'],
    SELFBALANCE: ['address(this).balance', 'uint'],
    MSIZE: ['msize()', 'uint'],
    GAS: ['gasleft()', 'uint'],
} as const;

export class Symbol0 extends Tag('Symbol0') {
    value: (typeof INFO)[keyof typeof INFO][0];

    constructor([value, type]: (typeof INFO)[keyof typeof INFO]) {
        super();
        this.value = value;
        this.type = type;
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return this.value;
    }
}

export const Info = mapValues(INFO, info => new Symbol0(info));

export class Symbol1 extends Tag('Symbol1') {
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

export class DataCopy extends Tag('DataCopy') {
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
    ...mapValues(Info, sym => (state: Ram<Expr>) => state.stack.push(sym)),
    BALANCE: symbol1(address => `${address}.balance`),
    CALLDATACOPY: datacopy((offset, size) => `msg.data[${offset}:(${offset}+${size})];`),
    CODECOPY: datacopy((offset, size) => `this.code[${offset}:(${offset}+${size})]`),
    EXTCODESIZE: symbol1(address => `address(${address}).code.length`),
    EXTCODECOPY: ({ stack }: Ram<Expr>): void => {
        const address = stack.pop();
        datacopy((offset, size) => `address(${address.str()}).code[${offset}:(${offset}+${size})]`);
    },
    RETURNDATACOPY: datacopy((offset, size) => `output[${offset}:(${offset}+${size})]`),
    EXTCODEHASH: symbol1(address => `keccak256(address(${address}).code)`),
    BLOCKHASH: symbol1(blockNumber => `blockhash(${blockNumber})`),
};

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
            // throw new Error('expected number in returndatacopy');
        } else {
            memory[Number(dest.val)] = new DataCopy(fn, offset, size);
        }
    };
}
