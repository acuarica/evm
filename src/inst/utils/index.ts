import { State } from '../../state';
import { CallDataLoad, CALLDATASIZE, CallValue } from '../info';
import { And, Byte, Eq, GT, IsZero, LT, Neg, Not, Or, Sar, Shl, Shr, Sig, Xor } from '../logic';
import { Add, Div, Exp, Mod, Mul, Sub } from '../math';
import { MLoad } from '../memory';
import { Sha3 } from '../sha3';
import { MappingLoad, SLoad } from '../storage';
import { DataCopy, Symbol0, Symbol1 } from '../symbols';
import { CALL, DELEGATECALL, ReturnData, STATICCALL } from '../system';

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
    | CALL
    | DELEGATECALL
    | STATICCALL
    | ReturnData;

// export type Stmt = ;

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
