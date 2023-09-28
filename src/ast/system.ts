import { type IInst, Tag, type Expr } from './expr';

export class Sha3 extends Tag('Sha3') {
    constructor(readonly args: Expr[], readonly memoryStart?: Expr, readonly memoryLength?: Expr) {
        super();
    }

    eval(): Expr {
        return new Sha3(
            this.args.map(e => e.eval()),
            this.memoryStart,
            this.memoryLength
        );
    }

    str(): string {
        return this.memoryStart && this.memoryLength
            ? `keccak256(memory[${this.memoryStart}:(${this.memoryStart}+${this.memoryLength})])`
            : `keccak256(${this.args.join(', ')})`;
    }
}

export class Create extends Tag('Create') {
    override readonly type = 'address';

    /**
     * Creates a new account with associated code.
     *
     * @param value Value in _wei_ to send to the new account.
     * @param offset Byte offset in the memory in bytes, the initialisation code for the new account.
     * @param size Byte size to copy (size of the initialisation code).
     */
    constructor(readonly value: Expr, readonly offset: Expr, readonly size: Expr) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `new Contract(memory[${this.offset}..${this.offset}+${this.size}]).value(${this.value}).address`;
    }
}

export class Call extends Tag('Call') {
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
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return this.argsLen.isZero() && this.retLen.isZero()
            ? this.gas.tag === 'Mul' &&
              this.gas.left.isZero() &&
              this.gas.right.isVal() &&
              this.gas.right.val === 2300n
                ? this.throwOnFail
                    ? `address(${this.address}).transfer(${this.value})`
                    : `address(${this.address}).send(${this.value})`
                : `address(${this.address}).call.gas(${this.gas}).value(${this.value})`
            : `call(${this.gas},${this.address},${this.value},${this.argsStart},${this.argsLen},${this.retStart},${this.retLen})`;
    }
}

export class ReturnData extends Tag('ReturnData') {
    readonly name = 'ReturnData';
    override readonly type = 'bytes';
    readonly wrapped = false;

    constructor(readonly retOffset: Expr, readonly retSize: Expr) {
        super();
    }

    eval(): Expr {
        return this;
    }
    str(): string {
        return `output:ReturnData:${this.retOffset}:${this.retSize}`;
    }
}

export class CallCode extends Tag('CallCode') {
    constructor(
        readonly gas: Expr,
        readonly address: Expr,
        readonly value: Expr,
        readonly memoryStart: Expr,
        readonly memoryLength: Expr,
        readonly outputStart: Expr,
        readonly outputLength: Expr
    ) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `callcode(${this.gas},${this.address},${this.value},${this.memoryStart},${this.memoryLength},${this.outputStart},${this.outputLength})`;
    }
}

export class Create2 extends Tag('Create2') {
    constructor(readonly offset: Expr, readonly size: Expr, readonly value: Expr) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `new Contract(memory[${this.offset}:(${this.offset}+${this.size})]).value(${this.value}).address`;
    }
}

export class StaticCall extends Tag('StaticCall') {
    constructor(
        readonly gas: Expr,
        readonly address: Expr,
        readonly memoryStart: Expr,
        readonly memoryLength: Expr,
        readonly outputStart: Expr,
        readonly outputLength: Expr
    ) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `staticcall(${this.gas},${this.address},${this.memoryStart},${this.memoryLength},${this.outputStart},${this.outputLength})`;
    }
}

export class DelegateCall extends Tag('DelegateCall') {
    constructor(
        readonly gas: Expr,
        readonly address: Expr,
        readonly memoryStart: Expr,
        readonly memoryLength: Expr,
        readonly outputStart: Expr,
        readonly outputLength: Expr
    ) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `delegatecall(${this.gas},${this.address},${this.memoryStart},${this.memoryLength},${this.outputStart},${this.outputLength})`;
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
     * @param args
     * @param offset Byte offset in the memory in bytes, to copy what will be the return data of this context.
     * @param size Byte size to copy (size of the return data).
     */
    constructor(readonly args: Expr[], readonly offset?: Expr, readonly size?: Expr) {}

    eval() {
        return this;
    }
}

export class Revert implements IInst {
    readonly name = 'Revert';
    constructor(readonly args: Expr[], readonly offset?: Expr, readonly size?: Expr) {}

    eval() {
        return this;
    }
}

export class Invalid implements IInst {
    readonly name = 'Invalid';
    constructor(readonly opcode: number) {}

    eval() {
        return this;
    }
}

export class SelfDestruct implements IInst {
    readonly name = 'SelfDestruct';
    constructor(readonly address: Expr) {}

    eval() {
        return this;
    }
}
