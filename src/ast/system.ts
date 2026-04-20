import { type IInst, Tag, type Expr, evalE } from './index.ts';

function info(...args: Expr[]): [depth: number, count: number] {
    return [
        Math.max(...args.map(e => e.depth)) + 1,
        (args?.reduce((accum, curr) => accum + curr.count, 0) ?? 0) + 1
    ];
}

export class Sha3 extends Tag {
    readonly tag = 'Sha3';
    readonly offset: Expr;
    readonly size: Expr;
    readonly args?: Expr[] | undefined;

    constructor(offset: Expr, size: Expr, args?: Expr[]) {
        super(...info(offset, size, ...args ?? []));
        this.offset = offset;
        this.size = size;
        this.args = args;
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
    readonly value: Expr;
    readonly offset: Expr;
    readonly size: Expr;
    readonly bytecode: Uint8Array | null;

    constructor(
        value: Expr,
        offset: Expr,
        size: Expr,
        bytecode: Uint8Array | null = null
    ) {
        super(...info(value, offset, size));
        this.value = value;
        this.offset = offset;
        this.size = size;
        this.bytecode = bytecode;
    }

    eval(): Expr {
        return new Create(this.value.eval(), this.offset.eval(), this.size.eval(), this.bytecode);
    }
}

export class Call extends Tag {
    readonly tag = 'Call';
    throwOnFail = false;

    readonly gas: Expr;
    readonly address: Expr;
    readonly value: Expr;
    readonly argsStart: Expr;
    readonly argsLen: Expr;
    readonly retStart: Expr;
    readonly retLen: Expr;

    constructor(
        gas: Expr,
        address: Expr,
        value: Expr,
        argsStart: Expr,
        argsLen: Expr,
        retStart: Expr,
        retLen: Expr
    ) {
        super(...info(gas, address, value, argsStart, argsLen, retStart, retLen));
        this.gas = gas;
        this.address = address;
        this.value = value;
        this.argsStart = argsStart;
        this.argsLen = argsLen;
        this.retStart = retStart;
        this.retLen = retLen;
    }

    eval(): Expr {
        return this;
    }
}

export class ReturnData extends Tag {
    readonly tag = 'ReturnData';
    override readonly type = 'bytes';
    readonly wrapped = false;
    readonly retOffset: Expr;
    readonly retSize: Expr;

    constructor(retOffset: Expr, retSize: Expr) {
        super(...info(retOffset, retSize));
        this.retOffset = retOffset;
        this.retSize = retSize;
    }

    eval(): Expr {
        return this;
    }
}

export class CallCode extends Tag {
    readonly tag = 'CallCode';

    readonly gas: Expr;
    readonly address: Expr;
    readonly value: Expr;
    readonly memoryStart: Expr;
    readonly memoryLength: Expr;
    readonly outputStart: Expr;
    readonly outputLength: Expr;

    constructor(
        gas: Expr,
        address: Expr,
        value: Expr,
        memoryStart: Expr,
        memoryLength: Expr,
        outputStart: Expr,
        outputLength: Expr
    ) {
        super(...info(gas, address, value, memoryStart, memoryLength, outputStart, outputLength));
        this.gas = gas;
        this.address = address;
        this.value = value;
        this.memoryStart = memoryStart;
        this.memoryLength = memoryLength;
        this.outputStart = outputStart;
        this.outputLength = outputLength;
    }

    eval(): Expr {
        return this;
    }
}

export class Create2 extends Tag {
    readonly tag = 'Create2';
    readonly offset: Expr;
    readonly size: Expr;
    readonly value: Expr;

    constructor(offset: Expr, size: Expr, value: Expr) {
        super(...info(offset, size, value));
        this.offset = offset;
        this.size = size;
        this.value = value;
    }

    eval(): Expr {
        return this;
    }
}

export class StaticCall extends Tag {
    readonly tag = 'StaticCall';
    readonly gas: Expr;
    readonly address: Expr;
    readonly memoryStart: Expr;
    readonly memoryLength: Expr;
    readonly outputStart: Expr;
    readonly outputLength: Expr;
    
    constructor(
        gas: Expr,
        address: Expr,
        memoryStart: Expr,
        memoryLength: Expr,
        outputStart: Expr,
        outputLength: Expr
    ) {
        super(...info(gas, address, memoryStart, memoryLength, outputStart, outputLength));
        this.gas = gas;
        this.address = address;
        this.memoryStart = memoryStart;
        this.memoryLength = memoryLength;
        this.outputStart = outputStart;
        this.outputLength = outputLength;
    }

    eval(): Expr {
        return this;
    }
}

export class DelegateCall extends Tag {
    readonly tag = 'DelegateCall';
    readonly gas: Expr;
    readonly address: Expr;
    readonly memoryStart: Expr;
    readonly memoryLength: Expr;
    readonly outputStart: Expr;
    readonly outputLength: Expr;
    
    constructor(
        gas: Expr,
        address: Expr,
        memoryStart: Expr,
        memoryLength: Expr,
        outputStart: Expr,
        outputLength: Expr
    ) {
        super(...info(gas, address, memoryStart, memoryLength, outputStart, outputLength));
        this.gas = gas;
        this.address = address;
        this.memoryStart = memoryStart;
        this.memoryLength = memoryLength;
        this.outputStart = outputStart;
        this.outputLength = outputLength;
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
    readonly offset: Expr;
    readonly size: Expr;
    readonly args?: Expr[] | undefined;

    /**
     * Exits the current context successfully.
     *
     * @param offset Byte offset in the memory in bytes, to copy what will be the return data of this context.
     * @param size Byte size to copy (size of the return data).
     * @param args
     */
    constructor(offset: Expr, size: Expr, args?: Expr[]) {
        this.offset = offset;
        this.size = size;
        this.args = args;
    }

    eval() {
        return new Return(this.offset.eval(), this.size.eval(), this.args?.map(evalE));
    }
}

/**
 * 
 */
export interface IReverts {
    [selector: string]: {
        /**
         * 
         */
        sig?: string;
    };
}

export class Revert implements IInst {
    readonly name = 'Revert';

    static readonly ERROR = '08c379a0';

    static readonly PANIC = '4e487b71';

    readonly offset: Expr;
    readonly size: Expr;
    readonly selector?: string | undefined;
    readonly sig?: IReverts[string] | undefined;
    readonly args?: Expr[] | undefined;

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
    constructor(offset: Expr, size: Expr, selector?: string, sig?: IReverts[string], args?: Expr[]) {
        this.offset = offset;
        this.size = size;
        this.selector = selector;
        this.sig = sig;
        this.args = args;
    }

    eval() {
        return new Revert(this.offset.eval(), this.size.eval(), this.selector, this.sig, this.args?.map(evalE));
    }

    /**
     * https://docs.soliditylang.org/en/latest/control-structures.html#panic-via-assert-and-error-via-require
     */
    static isRequireOrAssert(selector: string | undefined): boolean {
        return selector === undefined || selector === Revert.ERROR || selector === Revert.PANIC;
    }

    isRequireOrAssert(): boolean {
        return Revert.isRequireOrAssert(this.selector);
    }
}

export class Invalid implements IInst {
    readonly name = 'Invalid';
    readonly opcode: number;
    constructor(opcode: number) {
        this.opcode = opcode;
    }
    eval() {
        return this;
    }
}

export class SelfDestruct implements IInst {
    readonly name = 'SelfDestruct';
    readonly address: Expr;
    constructor(address: Expr) {
        this.address = address;
    }
    eval() {
        return this;
    }
}
