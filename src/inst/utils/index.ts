import { Jump, Jumpi } from '../../cfg';
import { State } from '../../state';
import { CallDataLoad, CALLDATASIZE, CallValue } from '../info';
import { Log } from '../log';
import { And, Byte, Eq, GT, IsZero, LT, Neg, Not, Or, Sar, Shl, Shr, Sig, Xor } from '../logic';
import { Add, Div, Exp, Mod, Mul, Sub } from '../math';
import { MLoad, MStore } from '../memory';
import { Sha3 } from '../sha3';
import { MappingLoad, MappingStore, SLoad, SStore } from '../storage';
import { DataCopy, Symbol0, Symbol1 } from '../symbols';
import {
    CALL,
    CALLCODE,
    CREATE,
    CREATE2,
    DELEGATECALL,
    Invalid,
    Return,
    ReturnData,
    Revert,
    SelfDestruct,
    STATICCALL,
    Stop,
} from '../system';

export type Expr =
    | bigint
    // Math
    | Add
    | Mul
    | Sub
    | Div
    | Mod
    | Mod
    | Exp
    // Logic
    | Sig
    | Eq
    | And
    | Or
    | IsZero
    | GT
    | LT
    | Xor
    | Not
    | Neg
    | Byte
    | Shl
    | Shr
    | Sar
    // Info
    | CallDataLoad
    | CALLDATASIZE
    | CallValue
    // Memory
    | MLoad
    | Sha3
    // Storage
    | MappingLoad
    | SLoad
    // Symbols
    | Symbol0
    | Symbol1
    | DataCopy
    // System
    | CREATE
    | CALL
    | CALLCODE
    | DELEGATECALL
    | CREATE2
    | STATICCALL
    | ReturnData;

export type Stmt =
    // Storage
    | SStore
    | MappingStore
    | MStore
    | Log
    | Jumpi
    | Jump
    // System
    | Stop
    | Return
    | Revert
    | SelfDestruct
    | Invalid;

export function memArgs<T>(
    { stack, memory }: State,
    Klass: new (args: Expr[], memoryStart?: Expr, memoryLength?: Expr) => T
): T {
    const MAXSIZE = 1024;

    const offset = stack.pop();
    const size = stack.pop();
    if (isBigInt(offset) && isBigInt(size) && size <= MAXSIZE * 32) {
        const args = [];
        for (let i = Number(offset); i < Number(offset + size); i += 32) {
            args.push(i in memory ? memory[i] : new MLoad(BigInt(i)));
        }
        return new Klass(args);
    } else {
        if (isBigInt(size) && size > MAXSIZE * 32) {
            throw new Error(`memargs size${Klass.toString()}${size}`);
        }

        return new Klass([], offset, size);
    }
}

export function isBigInt(expr: Expr): expr is bigint {
    return typeof expr === 'bigint';
}

export function isZero(expr: Expr): expr is bigint {
    return isBigInt(expr) && expr === 0n;
}

export function stringify(value: Expr): string {
    return typeof value === 'bigint'
        ? value.toString(16)
        : !value.wrapped
        ? value.toString()
        : `(${value.toString()})`;
}
