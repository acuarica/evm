import { type IInst, Tag, type Val, type Expr } from './expr';

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

    toString() {
        return 'return;';
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

    toString(): string {
        return this.offset && this.size
            ? `return memory[${this.offset}:(${this.offset}+${this.size})];`
            : this.args.length === 0
            ? 'return;'
            : isStringReturn(this.args) && this.args[0].val === 32n
            ? `return '${hex2a(this.args[2].val.toString(16))}';`
            : this.args.length === 1
            ? `return ${this.args[0]};`
            : `return (${this.args.join(', ')});`;
    }
}

function isStringReturn(args: Expr[]): args is [Val, Val, Val] {
    return args.length === 3 && args.every(arg => arg.isVal());
}

function hex2a(hexstr: string) {
    let str = '';
    for (let i = 0; i < hexstr.length && hexstr.slice(i, i + 2) !== '00'; i += 2) {
        str += String.fromCharCode(parseInt(hexstr.substring(i, i + 2), 16));
    }
    return str;
}

export class Revert implements IInst {
    readonly name = 'Revert';

    constructor(readonly args: Expr[], readonly offset?: Expr, readonly size?: Expr) {}

    eval() {
        return this;
    }

    toString() {
        return this.offset && this.size
            ? `revert(memory[${this.offset}:(${this.offset}+${this.size})]);`
            : `revert(${this.args.join(', ')});`;
    }
}

export class Invalid implements IInst {
    readonly name = 'Invalid';

    constructor(readonly opcode: number) {}

    eval() {
        return this;
    }

    toString() {
        return `revert('Invalid instruction (0x${this.opcode.toString(16)})');`;
    }
}

export class SelfDestruct implements IInst {
    readonly name = 'SelfDestruct';

    constructor(readonly address: Expr) {}

    eval() {
        return this;
    }

    toString() {
        return `selfdestruct(${this.address});`;
    }
}
