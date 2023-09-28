import { type IInst, Tag, type Expr } from './expr';

export class Sha3 extends Tag {
    readonly tag = 'Sha3';
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
     */
    constructor(readonly value: Expr, readonly offset: Expr, readonly size: Expr) {
        super();
    }

    eval(): Expr {
        return this;
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
        super();
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
        super();
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
        super();
    }

    eval(): Expr {
        return this;
    }
}

export class Create2 extends Tag {
    readonly tag = 'Create2';
    constructor(readonly offset: Expr, readonly size: Expr, readonly value: Expr) {
        super();
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
        super();
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
        super();
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
