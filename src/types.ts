import type { Expr } from './evm/expr';
import { type Info, INFO } from './evm/sym';

export type Type = 'address' | 'address payable' | 'uint256';

function bin(_expr: { left: Expr; right: Expr }): Type {
    return 'uint256';
}

const INFO_TYPES: { [key in (typeof INFO)[keyof typeof INFO]]: Type } = {
    [INFO['ADDRESS']]: 'address',
    [INFO['ORIGIN']]: 'address',
    [INFO['CALLER']]: 'address',
    [INFO['CODESIZE']]: 'uint256',
    [INFO['GASPRICE']]: 'uint256',
    [INFO['RETURNDATASIZE']]: 'uint256',
    [INFO['COINBASE']]: 'address payable',
    [INFO['TIMESTAMP']]: 'uint256',
    [INFO['NUMBER']]: 'uint256',
    [INFO['DIFFICULTY']]: 'uint256',
    [INFO['GASLIMIT']]: 'uint256',
    [INFO['CHAINID']]: 'uint256',
    [INFO['SELFBALANCE']]: 'uint256',
    [INFO['MSIZE']]: 'uint256',
    [INFO['GAS']]: 'uint256',
} as const;

export function typeOfSym(sym: Info): Type {
    return INFO_TYPES[sym];
}

const TYPES: { [tag in Expr['tag']]: (expr: Expr & { tag: tag }) => Type } = {
    Val: _ => 'uint256',
    Add: expr => bin(expr),
    Mul: expr => bin(expr),
    Sub: expr => bin(expr),
    Div: expr => bin(expr),
    Mod: expr => bin(expr),
    Exp: expr => bin(expr),
    Lt: expr => bin(expr),
    Gt: expr => bin(expr),
    Eq: expr => bin(expr),
    IsZero: _expr => 'uint256',
    And: expr => bin(expr),
    Or: expr => bin(expr),
    Xor: expr => bin(expr),
    Not: _expr => 'address',
    Byte: _expr => 'address',
    Shl: _expr => 'address',
    Shr: _expr => 'address',
    Sar: _expr => 'address',
    Sig: _expr => 'address',
    CallValue: _ => 'address',
    CallDataLoad: _ => 'address',
    CallDataSize: _ => 'address',
    Symbol0: expr => typeOfSym(expr.symbol),
    Symbol1: _expr => 'address',
    DataCopy: _expr => 'address',
    MLoad: _expr => 'address',
    Sha3: _expr => 'address',
    Create: _expr => 'address',
    Call: _expr => 'address',
    ReturnData: _expr => 'address',
    CallCode: _expr => 'address',
    Create2: _expr => 'address',
    StaticCall: _expr => 'address',
    DelegateCall: _expr => 'address',
    SLoad: _expr => 'address',
    MappingLoad: _expr => 'address',
};

export function typeOf(expr: Expr): Type {
    const fn = TYPES[expr.tag] as (expr: Expr) => Type;
    return fn(expr);
}
