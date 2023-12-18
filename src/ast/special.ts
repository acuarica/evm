import { type Expr, Tag } from './expr';

const BLOCK = {
    BASEFEE: ['basefee', 'uint', 0x48],
    COINBASE: ['coinbase', 'address payable', 0x41],
    TIMESTAMP: ['timestamp', 'uint', 0x42],
    NUMBER: ['number', 'uint', 0x43],
    DIFFICULTY: ['difficulty', 'uint', 0x44],
    // prevrandao
    GASLIMIT: ['gaslimit', 'uint', 0x45],
    CHAINID: ['chainid', 'uint', 0x46],
} as const;

const MSG = {
    CALLER: ['sender', 'address', 0x33],
    CALLDATASIZE: ['data.length', 'uint', 0x36],
} as const;

const TX = {
    ORIGIN: ['origin', 'address', 0x32],
    GASPRICE: ['gasprice', 'uint', 0x3a],
} as const;

type Props<K extends string = string> = { [k in K]: readonly [string, string, number] };

const mapValues = <K extends string, V, W>(o: { [k in K]: V }, fn: (v: V) => W) =>
    Object.fromEntries(Object.entries(o).map(([name, value]) => [name, fn(value)]));

const applyPrefix = <const P extends Props, const O extends string>(props: P, obj: O) =>
    mapValues(props, ([field, type, opcode]) => [`${obj}.${field}`, type, opcode]) as {
        [prop in keyof P]: readonly [`${O}.${P[prop][0]}`, P[prop][1], P[prop][2]];
    };

const PROPS = {
    ADDRESS: ['address(this)', 'address', 0x30],
    CODESIZE: ['codesize()', 'uint', 0x38],
    RETURNDATASIZE: ['returndatasize()', 'uint', 0x3d],
    ...applyPrefix(BLOCK, 'block'),
    ...applyPrefix(MSG, 'msg'),
    ...applyPrefix(TX, 'tx'),
    SELFBALANCE: ['address(this).balance', 'uint', 0x47],
    MSIZE: ['msize()', 'uint', 0x59],
    GAS: ['gasleft()', 'uint', 0x5a],
} as const;

/**
 * https://docs.soliditylang.org/en/develop/units-and-global-variables.html#special-variables-and-functions
 */
export class Prop extends Tag {
    readonly tag = 'Prop';
    readonly value: (typeof PROPS)[keyof typeof PROPS][0];
    readonly opcode: number;

    constructor([value, type, opcode]: (typeof PROPS)[keyof typeof PROPS]) {
        super();
        this.value = value;
        this.type = type;
        this.opcode = opcode;
    }

    eval(): Expr {
        return this;
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
    BALANCE: [(address: string) => `${address}.balance`, 'uint256', 0x31],
    EXTCODESIZE: [(address: string) => `address(${address}).code.length`, 'uint256', 0x3b],
    EXTCODEHASH: [(address: string) => `keccak256(address(${address}).code)`, 'bytes32', 0x3f],
    BLOCKHASH: [(blockNumber: string) => `blockhash(${blockNumber})`, 'bytes32', 0x40],
} as const;

export class Fn extends Tag {
    readonly tag = 'Fn';
    constructor(readonly mnemonic: keyof typeof FNS, readonly value: Expr) {
        super();
        this.type = FNS[mnemonic][1];
    }

    eval(): Expr {
        return new Fn(this.mnemonic, this.value.eval());
    }
}

export class DataCopy extends Tag {
    readonly tag = 'DataCopy';
    constructor(
        readonly kind: 'calldatacopy' | 'codecopy' | 'extcodecopy' | 'returndatacopy',
        readonly offset: Expr,
        readonly size: Expr,
        readonly address?: Expr
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
export class CallValue extends Tag {
    readonly tag = 'CallValue';
    eval(): Expr {
        return this;
    }
}

export class CallDataLoad extends Tag {
    readonly tag = 'CallDataLoad';
    constructor(public location: Expr) {
        super();
    }
    eval(): Expr {
        return new CallDataLoad(this.location.eval());
        // this.location = this.location.eval();
        // return this;
    }
}
