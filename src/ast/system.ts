import { type IInst, Tag, type Expr, evalE } from '.';

function info(...args: Expr[]): [depth: number, count: number] {
    return [
        Math.max(...args.map(e => e.depth)) + 1,
        (args?.reduce((accum, curr) => accum + curr.count, 0) ?? 0) + 1
    ];
}

export class Sha3 extends Tag {
    readonly tag = 'Sha3';
    constructor(readonly offset: Expr, readonly size: Expr, readonly args?: Expr[]) {
        super(...info(offset, size, ...args ?? []));
    }

    eval(): Sha3 {
        return new Sha3(this.offset.eval(), this.size.eval(), this.args?.map(evalE));
    }

    override children(): Expr[] {
        return [...super.children(), ...this.args ?? []];
    }
}

export class Create extends Tag {
    readonly tag = 'Create';
    override readonly type = 'address';

    /**
     * Creates a new account with associated code.
     *
     * @param value Value in _wei_ to send to the new account.
     * @param offset Byte offset in the memory in bytes, the initialisation code for the new account.
     * @param size Byte size to copy (size of the initialisation code).
     * @param bytecode 
     */
    constructor(
        readonly value: Expr,
        readonly offset: Expr,
        readonly size: Expr,
        readonly bytecode: Uint8Array | null = null
    ) {
        super(...info(value, offset, size));
    }

    eval(): Expr {
        return new Create(this.value.eval(), this.offset.eval(), this.size.eval(), this.bytecode);
    }
}

export class Call extends Tag {
    readonly tag = 'Call';
    throwOnFail = false;

    constructor(
        readonly gas: Expr,
        readonly address: Expr,
        readonly value: Expr,
        readonly argsStart: Expr,
        readonly argsLen: Expr,
        readonly retStart: Expr,
        readonly retLen: Expr
    ) {
        super(...info(gas, address, value, argsStart, argsLen, retStart, retLen));
    }

    eval(): Expr {
        return this;
    }
}

export class ReturnData extends Tag {
    readonly tag = 'ReturnData';
    override readonly type = 'bytes';
    readonly wrapped = false;

    constructor(readonly retOffset: Expr, readonly retSize: Expr) {
        super(...info(retOffset, retSize));
    }

    eval(): Expr {
        return this;
    }
}

export class CallCode extends Tag {
    readonly tag = 'CallCode';
    constructor(
        readonly gas: Expr,
        readonly address: Expr,
        readonly value: Expr,
        readonly memoryStart: Expr,
        readonly memoryLength: Expr,
        readonly outputStart: Expr,
        readonly outputLength: Expr
    ) {
        super(...info(gas, address, value, memoryStart, memoryLength, outputStart, outputLength));
    }

    eval(): Expr {
        return this;
    }
}

export class Create2 extends Tag {
    readonly tag = 'Create2';
    constructor(readonly offset: Expr, readonly size: Expr, readonly value: Expr) {
        super(...info(offset, size, value));
    }

    eval(): Expr {
        return this;
    }
}

export class StaticCall extends Tag {
    readonly tag = 'StaticCall';
    constructor(
        readonly gas: Expr,
        readonly address: Expr,
        readonly memoryStart: Expr,
        readonly memoryLength: Expr,
        readonly outputStart: Expr,
        readonly outputLength: Expr
    ) {
        super(...info(gas, address, memoryStart, memoryLength, outputStart, outputLength));
    }

    eval(): Expr {
        return this;
    }
}

export class DelegateCall extends Tag {
    readonly tag = 'DelegateCall';
    constructor(
        readonly gas: Expr,
        readonly address: Expr,
        readonly memoryStart: Expr,
        readonly memoryLength: Expr,
        readonly outputStart: Expr,
        readonly outputLength: Expr
    ) {
        super(...info(gas, address, memoryStart, memoryLength, outputStart, outputLength));
    }

    eval(): Expr {
        return this;
    }
}

export class Stop implements IInst {
    readonly name = 'Stop';
    eval() {
        return this;
    }
}

export class Return implements IInst {
    readonly name = 'Return';

    /**
     * Exits the current context successfully.
     *
     * @param offset Byte offset in the memory in bytes, to copy what will be the return data of this context.
     * @param size Byte size to copy (size of the return data).
     * @param args
     */
    constructor(readonly offset: Expr, readonly size: Expr, readonly args?: Expr[]) { }

    eval() {
        return new Return(this.offset.eval(), this.size.eval(), this.args?.map(evalE));
    }
}

export class Revert implements IInst {
    readonly name = 'Revert';

    /**
     * https://docs.soliditylang.org/en/latest/control-structures.html#panic-via-assert-and-error-via-require
     */
    static readonly ERROR = '08c379a0';

    static readonly PANIC = '4e487b71';

    /**
     * Stop the current context execution, revert the state changes (see `STATICCALL` for a list
     * of state changing opcodes) and return the unused gas to the caller.
     *
     * It also reverts the gas refund to its value before the current context.
     * If the execution is stopped with `REVERT`, the value 0 is put on the stack of the calling context,
     * which continues to execute normally.
     * The return data of the calling context is set as the given chunk of memory of this context.
     *
     * @param offset byte offset in the memory in bytes. The return data of the calling context.
     * @param size byte size to copy (size of the return data).
     * @param args
     */
    constructor(readonly offset: Expr, readonly size: Expr, readonly selector?: string, readonly args?: Expr[]) { }

    eval() {
        return new Revert(this.offset.eval(), this.size.eval(), this.selector, this.args?.map(evalE));
    }

    isRequireOrAssert(): boolean {
        return this.selector === undefined || this.selector === Revert.ERROR || this.selector === Revert.PANIC;
    }
}

export class Invalid implements IInst {
    readonly name = 'Invalid';
    constructor(readonly opcode: number) { }
    eval() {
        return this;
    }
}

export class SelfDestruct implements IInst {
    readonly name = 'SelfDestruct';
    constructor(readonly address: Expr) { }
    eval() {
        return this;
    }
}
