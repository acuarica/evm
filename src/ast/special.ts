import { type Expr, Tag } from '.';
import type { Type } from '../type';

/**
 * Represents a global Solidity built-in property.
 * 
 * @see https://docs.soliditylang.org/en/develop/units-and-global-variables.html#special-variables-and-functions
 */
export class Prop extends Tag {
    readonly tag = 'Prop';

    constructor(readonly symbol: string, override readonly type: Type) {
        super(0, 1);
    }

    eval(): Expr {
        return this;
    }
}

const prop = <S extends string>(prop: readonly [S, Type]) =>
    [prop[0], new Prop(prop[0], prop[1])] as const;

const applyPrefix = <const S extends string, const O extends string>(
    props: readonly (readonly [S, Type])[], obj: O
) => props.map(([field, type]) => [`${obj}.${field}`, type] as const);

/**
 * A collection of _Block and Transaction Properties_ defined as `Prop`.
 * 
 * @see https://docs.soliditylang.org/en/develop/units-and-global-variables.html#block-and-transaction-properties
 * @see {@link Prop}
 */
export const Props = Object.assign(
    Object.fromEntries(([
        ['address(this)', 'address'],
        ['codesize()', 'uint'],
        ['returndatasize()', 'uint'],
        ['address(this).balance', 'uint'],
        ['gasleft()', 'uint'],
    ] as const).map(prop)),
    Object.fromEntries(applyPrefix([
        ['basefee', 'uint'],
        ['coinbase', 'address payable'],
        ['timestamp', 'uint'],
        ['number', 'uint'],
        ['difficulty', 'uint'],
        ['gaslimit', 'uint'],
        ['chainid', 'uint'],
        ['prevrandao', 'uint'],
    ] as const, 'block').map(prop)),
    Object.fromEntries(applyPrefix([
        ['sender', 'address'],
        ['data.length', 'uint'],
    ] as const, 'msg').map(prop)),
    Object.fromEntries(applyPrefix([
        ['origin', 'address'],
        ['gasprice', 'uint'],
    ] as const, 'tx').map(prop)),
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
        super(value.depth + 1, value.count + 1);
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
        readonly address?: Expr,
        readonly bytecode?: Uint8Array,
    ) {
        super(
            Math.max(offset.depth, size.depth, address?.depth ?? 0) + 1,
            offset.count + size.count + (address?.count ?? 0) + 1);
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
    constructor() {
        super(0, 1);
    }
    eval(): Expr {
        return this;
    }
}

export class CallDataLoad extends Tag {
    readonly tag = 'CallDataLoad';
    constructor(public location: Expr) {
        super(location.depth + 1, location.count + 1);
    }
    eval(): Expr {
        return new CallDataLoad(this.location.eval());
        // this.location = this.location.eval();
        // return this;
    }
}
