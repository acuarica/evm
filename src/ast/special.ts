import { mapValues } from '../object';
import { type Expr, Tag, Val } from './expr';

const BLOCK = {
    BASEFEE: ['basefee', 'uint'],
    COINBASE: ['coinbase', 'address payable'],
    TIMESTAMP: ['timestamp', 'uint'],
    NUMBER: ['number', 'uint'],
    DIFFICULTY: ['difficulty', 'uint'],
    // prevrandao
    GASLIMIT: ['gaslimit', 'uint'],
    CHAINID: ['chainid', 'uint'],
} as const;

const MSG = {
    CALLER: ['sender', 'address'],
    CALLDATASIZE: ['data.length', 'uint'],
} as const;

const TX = {
    ORIGIN: ['origin', 'address'],
    GASPRICE: ['gasprice', 'uint'],
} as const;

type Props<K extends string = string> = { [k in K]: readonly [string, string] };

const applyPrefix = <P extends Props, O extends string>(props: P, obj: O) =>
    mapValues(props, ([field, type]) => [`${obj}.${field}`, type]) as {
        [prop in keyof P]: readonly [`${O}.${P[prop][0]}`, P[prop][1]];
    };

const PROPS = {
    ADDRESS: ['address(this)', 'address'],
    CODESIZE: ['codesize()', 'uint'],
    RETURNDATASIZE: ['returndatasize()', 'uint'],
    ...applyPrefix(BLOCK, 'block'),
    ...applyPrefix(MSG, 'msg'),
    ...applyPrefix(TX, 'tx'),
    SELFBALANCE: ['address(this).balance', 'uint'],
    MSIZE: ['msize()', 'uint'],
    GAS: ['gasleft()', 'uint'],
} as const;

/**
 * https://docs.soliditylang.org/en/develop/units-and-global-variables.html#special-variables-and-functions
 */
export class Prop extends Tag('Prop') {
    readonly value: (typeof PROPS)[keyof typeof PROPS][0];

    constructor([value, type]: (typeof PROPS)[keyof typeof PROPS]) {
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

export const Info = mapValues(PROPS, info => new Prop(info));

export const Block = Object.fromEntries(
    Object.entries(BLOCK).map(([mnemonic, [field, _type]]) => [field, Info[mnemonic]])
);

export const Msg = Object.fromEntries(
    Object.entries(MSG).map(([mnemonic, [field, _type]]) => [field, Info[mnemonic]])
);

export const Tx = Object.fromEntries(
    Object.entries(TX).map(([mnemonic, [field, _type]]) => [field, Info[mnemonic]])
);

export const FNS = {
    BALANCE: [(address: string) => `${address}.balance`, 'uint256'],
    EXTCODESIZE: [(address: string) => `address(${address}).code.length`, 'uint256'],
    EXTCODEHASH: [(address: string) => `keccak256(address(${address}).code)`, 'bytes32'],
    BLOCKHASH: [(blockNumber: string) => `blockhash(${blockNumber})`, 'bytes32'],
} as const;

export class Fn extends Tag('Fn') {
    constructor(readonly mnemonic: keyof typeof FNS, readonly value: Expr) {
        super();
        this.type = FNS[mnemonic][1];
    }

    eval(): Expr {
        return new Fn(this.mnemonic, this.value.eval());
    }

    str(): string {
        return FNS[this.mnemonic][0](this.value._str(Val.prec));
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
}

/**
 * Get deposited value by the instruction/transaction responsible for this execution.
 */
export class CallValue extends Tag('CallValue') {
    eval(): Expr {
        return this;
    }
}

export class CallDataLoad extends Tag('CallDataLoad') {
    constructor(public location: Expr) {
        super();
    }
    eval(): Expr {
        this.location = this.location.eval();
        return this;
    }
}
