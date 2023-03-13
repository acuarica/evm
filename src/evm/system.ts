import type { Opcode } from '../opcode';
import type { State } from '../state';
import { Tag, Val, type Expr, type Stmt } from './ast';
import { MLoad } from './memory';

export class Sha3 extends Tag('Sha3', Val.prec) {
    readonly name = 'SHA3';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly items: Expr[], readonly memoryStart?: Expr, readonly memoryLength?: Expr) {
        super();
    }

    eval(): Expr {
        return new Sha3(
            this.items.map(e => e.eval()),
            this.memoryStart,
            this.memoryLength
        );
    }

    str(): string {
        if (this.memoryStart && this.memoryLength) {
            return `keccak256(memory[${this.memoryStart.str()}:(${this.memoryStart.str()}+${this.memoryLength.str()})])`;
        } else {
            return `keccak256(${this.items.map(item => item.str()).join(', ')})`;
        }
    }
}

export class CREATE extends Tag('Create', Val.prec) {
    readonly type = 'address';

    constructor(readonly memoryStart: Expr, readonly memoryLength: Expr, readonly value: Expr) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `(new Contract(memory[${this.memoryStart.str()}:(${this.memoryStart.str()}+${this.memoryLength.str()})]).value(${this.value.str()})).address`;
    }
}

export class CALL extends Tag('Call', Val.prec) {
    readonly name = 'Call';
    readonly type?: string;
    readonly wrapped = false;
    throwOnFail = false;

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
        if (this.memoryLength.isZero() && this.outputLength.isZero()) {
            if (
                this.gas.tag === 'Mul' &&
                this.gas.left.isZero() &&
                this.gas.right.isVal() &&
                this.gas.right.val === 2300n
            ) {
                if (this.throwOnFail) {
                    return `address(${this.address.str()}).transfer(${this.value.str()})`;
                } else {
                    return `address(${this.address.str()}).send(${this.value.str()})`;
                }
            } else {
                return `address(${this.address.str()}).call.gas(${this.gas.str()}).value(${this.value.str()})`;
            }
        } else {
            return `call(${this.gas.str()},${this.address.str()},${this.value.str()},${this.memoryStart.str()},${this.memoryLength.str()},${this.outputStart.str()},${this.outputLength.str()})`;
        }
    }
}

export class ReturnData extends Tag('ReturnData', Val.prec) {
    readonly name = 'ReturnData';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly retOffset: any, readonly retSize: any) {
        super();
    }

    eval(): Expr {
        return this;
    }
    str(): string {
        return `output:ReturnData:${this.retOffset}:${this.retSize}`;
    }
}
export class CALLCODE extends Tag('CallCode', Val.prec) {
    readonly name = 'CALLCODE';
    readonly type?: string;
    readonly wrapped = true;

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
        return `callcode(${this.gas.str()},${this.address.str()},${this.value.str()},${this.memoryStart.str()},${this.memoryLength.str()},${this.outputStart.str()},${this.outputLength.str()})`;
    }
}

export class CREATE2 extends Tag('Create2', Val.prec) {
    readonly name = 'CREATE2';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly memoryStart: Expr, readonly memoryLength: Expr, readonly value: Expr) {
        super();
    }

    eval(): Expr {
        return this;
    }

    str(): string {
        return `(new Contract(memory[${this.memoryStart.str()}:(${this.memoryStart.str()}+${this.memoryLength.str()})]).value(${this.value.str()})).address`;
    }
}

export class STATICCALL extends Tag('StaticCall', Val.prec) {
    readonly name = 'STATICCALL';
    readonly type?: string;
    readonly wrapped = true;

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
        return `staticcall(${this.gas.str()},${this.address.str()},${this.memoryStart.str()},${this.memoryLength.str()},${this.outputStart.str()},${this.outputLength.str()})`;
    }
}

export class DELEGATECALL extends Tag('DelegateCall', Val.prec) {
    readonly name = 'DELEGATECALL';
    readonly type?: string;
    readonly wrapped = true;

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
        return `delegatecall(${this.gas.str()},${this.address.str()},${this.memoryStart.str()},${this.memoryLength.str()},${this.outputStart.str()},${this.outputLength.str()})`;
    }
}

export class Stop {
    readonly name = 'Stop';

    eval() {
        return this;
    }

    toString() {
        return 'return;';
    }
}

export class Return {
    readonly name = 'Return';
    readonly wrapped = true;

    constructor(readonly args: Expr[], readonly memoryStart?: Expr, readonly memoryLength?: Expr) {}

    // eval() {
    //     return new Return(this.args.map(evalExpr), this.memoryStart, this.memoryLength);
    // }

    toString(): string {
        if (this.memoryStart && this.memoryLength) {
            return `return memory[${wrap(this.memoryStart)}:(${wrap(this.memoryStart)}+${wrap(
                this.memoryLength
            )})];`;
        } else if (this.args.length === 0) {
            return 'return;';
        } else if (
            this.args.length === 1 &&
            (isBigInt(this.args[0]) || (this.args[0] as any).static)
        ) {
            return 'return ' + this.args[0] + ';';
        } else if (
            this.args.length === 3 &&
            this.args.every(item => isBigInt(item)) &&
            this.args[0] === 32n
        ) {
            return 'return "' + hex2a(this.args[2].toString(16)) + '";';
        } else {
            return this.args.length === 1
                ? `return ${wrap(this.args[0])};`
                : `return (${this.args.map(item => wrap(item)).join(', ')});`;
        }
    }
}

function hex2a(hexx: any) {
    const hex = hexx.toString();
    let str = '';
    for (let i = 0; i < hex.length && hex.substr(i, 2) !== '00'; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

export class Revert {
    readonly name = 'REVERT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly items: Expr[],
        readonly memoryStart?: Expr,
        readonly memoryLength?: Expr
    ) {}

    eval() {
        return this;
    }

    toString() {
        if (this.memoryStart && this.memoryLength) {
            return `revert(memory[${wrap(this.memoryStart)}:(${wrap(this.memoryStart)}+${wrap(
                this.memoryLength
            )})]);`;
        } else {
            return 'revert(' + this.items.map(item => wrap(item)).join(', ') + ');';
        }
    }
}

export class Invalid {
    readonly name = 'Invalid';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly opcode: number) {}

    eval() {
        return this;
    }

    toString = () => `revert("Invalid instruction (0x${this.opcode.toString(16)})");`;
}

export class SelfDestruct {
    readonly name = 'SELFDESTRUCT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly address: any) {}

    eval() {
        return this;
    }

    toString = () => `selfdestruct(${wrap(this.address)});`;
}

export function memArgs0<T>(
    offset: Expr,
    size: Expr,
    { memory }: State<Stmt, Expr>,
    Klass: new (args: Expr[], offset?: Expr, size?: Expr) => T
): T {
    const MAXSIZE = 1024;

    offset = offset.eval();
    size = size.eval();

    if (offset.isVal() && size.isVal() && size.val <= MAXSIZE * 32) {
        const args = [];
        for (let i = Number(offset); i < Number(offset.val + size.val); i += 32) {
            args.push(i in memory ? memory[i] : new MLoad(new Val(BigInt(i))));
        }

        return new Klass(args);
    } else {
        if (size.isVal() && size.val > MAXSIZE * 32) {
            throw new Error(`memargs size${Klass.toString()}${size.val}`);
        }

        return new Klass([], offset, size);
    }
}

export function memArgs<T>(
    state: State<Stmt, Expr>,
    Klass: new (args: Expr[], offset?: Expr, size?: Expr) => T
): T {
    const offset = state.stack.pop();
    const size = state.stack.pop();
    return memArgs0(offset, size, state, Klass);
}

export const SYSTEM = {
    SHA3: (state: State<Stmt, Expr>): void => {
        state.stack.push(memArgs(state, Sha3));
    },
    STOP: (state: State<Stmt, Expr>): void => {
        state.halted = true;
        state.stmts.push(new Stop());
    },

    CREATE: ({ stack }: State<Stmt, Expr>): void => {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new CREATE(memoryStart, memoryLength, value));
    },
    CALL: ({ stack, memory }: State<Stmt, Expr>): void => {
        const gas = stack.pop();
        const address = stack.pop();
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new CALL(gas, address, value, memoryStart, memoryLength, outputStart, outputLength)
        );

        // if (typeof outputStart !== 'number') {
        //     console.log('WARN:CALL outstart should be number');
        // }

        memory[outputStart as any as number] = new ReturnData(outputStart, outputLength);
    },
    CALLCODE: ({ stack }: State<Stmt, Expr>): void => {
        const gas = stack.pop();
        const address = stack.pop();
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();

        stack.push(
            new CALLCODE(gas, address, value, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    RETURN: (state: State<Stmt, Expr>): void => {
        state.halted = true;
        state.stmts.push(memArgs(state, Return));
    },
    DELEGATECALL: ({ stack }: State<Stmt, Expr>): void => {
        const gas = stack.pop();
        const address = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new DELEGATECALL(gas, address, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    CREATE2: ({ stack }: State<Stmt, Expr>): void => {
        const value = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        stack.push(new CREATE2(memoryStart, memoryLength, value));
    },
    STATICCALL: ({ stack }: State<Stmt, Expr>): void => {
        const gas = stack.pop();
        const address = stack.pop();
        const memoryStart = stack.pop();
        const memoryLength = stack.pop();
        const outputStart = stack.pop();
        const outputLength = stack.pop();
        stack.push(
            new STATICCALL(gas, address, memoryStart, memoryLength, outputStart, outputLength)
        );
    },
    REVERT: (state: State<Stmt, Expr>): void => {
        state.halted = true;
        state.stmts.push(memArgs(state, Revert));
    },

    SELFDESTRUCT: (state: State<Stmt, Expr>): void => {
        const address = state.stack.pop();
        state.halted = true;
        state.stmts.push(new SelfDestruct(address));
    },
};

export const INVALID = (opcode: Opcode, state: State<Stmt, Expr>): void => {
    state.halted = true;
    state.stmts.push(new Invalid(opcode.opcode));
};
