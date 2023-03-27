import type { Opcode } from '../opcode';
import type { State } from '../state';
import { type IInst, Val, type Expr, type Inst } from './expr';
declare const Sha3_base: (abstract new () => {
    readonly tag: "Sha3";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Sha3 extends Sha3_base {
    readonly args: Expr[];
    readonly memoryStart?: Expr | undefined;
    readonly memoryLength?: Expr | undefined;
    constructor(args: Expr[], memoryStart?: Expr | undefined, memoryLength?: Expr | undefined);
    eval(): Expr;
    str(): string;
}
declare const Create_base: (abstract new () => {
    readonly tag: "Create";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Create extends Create_base {
    readonly value: Expr;
    readonly offset: Expr;
    readonly size: Expr;
    readonly type = "address";
    /**
     * Creates a new account with associated code.
     *
     * @param value Value in _wei_ to send to the new account.
     * @param offset Byte offset in the memory in bytes, the initialisation code for the new account.
     * @param size Byte size to copy (size of the initialisation code).
     */
    constructor(value: Expr, offset: Expr, size: Expr);
    eval(): Expr;
    str(): string;
}
declare const Call_base: (abstract new () => {
    readonly tag: "Call";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Call extends Call_base {
    readonly gas: Expr;
    readonly address: Expr;
    readonly value: Expr;
    readonly memoryStart: Expr;
    readonly memoryLength: Expr;
    readonly outputStart: Expr;
    readonly outputLength: Expr;
    throwOnFail: boolean;
    constructor(gas: Expr, address: Expr, value: Expr, memoryStart: Expr, memoryLength: Expr, outputStart: Expr, outputLength: Expr);
    eval(): Expr;
    str(): string;
}
declare const ReturnData_base: (abstract new () => {
    readonly tag: "ReturnData";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class ReturnData extends ReturnData_base {
    readonly retOffset: any;
    readonly retSize: any;
    readonly name = "ReturnData";
    readonly type?: string;
    readonly wrapped = false;
    constructor(retOffset: any, retSize: any);
    eval(): Expr;
    str(): string;
}
declare const CallCode_base: (abstract new () => {
    readonly tag: "CallCode";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class CallCode extends CallCode_base {
    readonly gas: Expr;
    readonly address: Expr;
    readonly value: Expr;
    readonly memoryStart: Expr;
    readonly memoryLength: Expr;
    readonly outputStart: Expr;
    readonly outputLength: Expr;
    readonly name = "CallCode";
    constructor(gas: Expr, address: Expr, value: Expr, memoryStart: Expr, memoryLength: Expr, outputStart: Expr, outputLength: Expr);
    eval(): Expr;
    str(): string;
}
declare const Create2_base: (abstract new () => {
    readonly tag: "Create2";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class Create2 extends Create2_base {
    readonly offset: Expr;
    readonly size: Expr;
    readonly value: Expr;
    constructor(offset: Expr, size: Expr, value: Expr);
    eval(): Expr;
    str(): string;
}
declare const StaticCall_base: (abstract new () => {
    readonly tag: "StaticCall";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class StaticCall extends StaticCall_base {
    readonly gas: Expr;
    readonly address: Expr;
    readonly memoryStart: Expr;
    readonly memoryLength: Expr;
    readonly outputStart: Expr;
    readonly outputLength: Expr;
    constructor(gas: Expr, address: Expr, memoryStart: Expr, memoryLength: Expr, outputStart: Expr, outputLength: Expr);
    eval(): Expr;
    str(): string;
}
declare const DelegateCall_base: (abstract new () => {
    readonly tag: "DelegateCall";
    readonly type?: string;
    isVal(): this is Val;
    isZero(): this is Val;
    isJumpDest(): boolean;
    eval(): Expr;
    str(): string;
    _str(prec: any): string;
    toString(): string;
}) & {
    readonly prec: number;
};
export declare class DelegateCall extends DelegateCall_base {
    readonly gas: Expr;
    readonly address: Expr;
    readonly memoryStart: Expr;
    readonly memoryLength: Expr;
    readonly outputStart: Expr;
    readonly outputLength: Expr;
    constructor(gas: Expr, address: Expr, memoryStart: Expr, memoryLength: Expr, outputStart: Expr, outputLength: Expr);
    eval(): Expr;
    str(): string;
}
export declare class Stop implements IInst {
    readonly name = "Stop";
    eval(): this;
    toString(): string;
}
export declare class Return implements IInst {
    readonly args: Expr[];
    readonly offset?: Expr | undefined;
    readonly size?: Expr | undefined;
    readonly name = "Return";
    /**
     * Exits the current context successfully.
     *
     * @param args
     * @param offset Byte offset in the memory in bytes, to copy what will be the return data of this context.
     * @param size Byte size to copy (size of the return data).
     */
    constructor(args: Expr[], offset?: Expr | undefined, size?: Expr | undefined);
    eval(): this;
    toString(): string;
}
export declare class Revert implements IInst {
    readonly args: Expr[];
    readonly offset?: Expr | undefined;
    readonly size?: Expr | undefined;
    readonly name = "Revert";
    constructor(args: Expr[], offset?: Expr | undefined, size?: Expr | undefined);
    eval(): this;
    toString(): string;
}
export declare class Invalid implements IInst {
    readonly reason: string;
    readonly name = "Invalid";
    constructor(reason: string);
    eval(): this;
    toString(): string;
}
export declare class SelfDestruct implements IInst {
    readonly address: Expr;
    readonly name = "SelfDestruct";
    constructor(address: Expr);
    eval(): this;
    toString(): string;
}
export declare function memArgs<T>({ stack, memory }: State<Inst, Expr>, Klass: new (args: Expr[], offset?: Expr, size?: Expr) => T): T;
export declare const SYSTEM: {
    SHA3: (state: State<Inst, Expr>) => void;
    STOP: (state: State<Inst, Expr>) => void;
    CREATE: ({ stack }: State<Inst, Expr>) => void;
    CALL: ({ stack, memory }: State<Inst, Expr>) => void;
    CALLCODE: ({ stack }: State<Inst, Expr>) => void;
    RETURN: (state: State<Inst, Expr>) => void;
    DELEGATECALL: ({ stack }: State<Inst, Expr>) => void;
    CREATE2: ({ stack }: State<Inst, Expr>) => void;
    STATICCALL: ({ stack }: State<Inst, Expr>) => void;
    REVERT: (state: State<Inst, Expr>) => void;
    SELFDESTRUCT: (state: State<Inst, Expr>) => void;
};
export declare const PC: (opcode: Opcode, { stack }: State<Inst, Expr>) => void;
export declare const INVALID: (opcode: Opcode, state: State<Inst, Expr>) => void;
export {};
