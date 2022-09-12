import { Branch } from './cfg';
import { type Contract } from './contract';
import { hex2a } from './hex';

/**
 *
 */
export type Expr =
    | bigint
    | Val
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
    | If
    | Require
    | SStore
    | MappingStore
    | MStore
    | Log
    | Jumpi
    | Jump
    | JumpDest
    | SigCase
    | CallSite
    // System
    | Stop
    | Return
    | Revert
    | SelfDestruct
    | Invalid;

export class Val {
    readonly name = 'Val';
    readonly wrapped = false;
    readonly type?: string;

    isJumpDest = false;

    constructor(readonly value: bigint) {}

    toString() {
        return `${this.isJumpDest ? '[J]' : ''}${this.value.toString(16)}`;
    }

    eval() {
        return this.value;
    }
}

export function isBigInt<E>(expr: bigint | E): expr is bigint {
    return typeof expr === 'bigint';
}

export function isVal(expr: Expr): expr is Val {
    return expr instanceof Val;
}

export function isZero(expr: Expr): expr is bigint {
    return (isBigInt(expr) && expr === 0n) || (isVal(expr) && expr.value === 0n);
}

export function wrap(value: Expr): string {
    return typeof value === 'bigint'
        ? value.toString(16)
        : !value.wrapped
        ? value.toString()
        : `(${value.toString()})`;
}

export const Name = <N extends string>(name: N, wrapped: boolean) =>
    class {
        readonly name: N = name;
        readonly wrapped = wrapped;
    };

export const Bin = <N extends string>(name: N, op: string) =>
    class extends Name(name, true) {
        readonly type?: string;
        constructor(readonly left: Expr, readonly right: Expr) {
            super();
        }

        override toString() {
            return `${wrap(this.left)} ${op} ${wrap(this.right)}`;
        }
    };

const Unary = <N extends string | null>(name: N, op: string) =>
    class {
        readonly name: N = name;
        readonly type?: string;
        readonly wrapped = false;

        constructor(readonly value: Expr) {}

        eval() {
            return this;
        }
        toString() {
            return `${op}${wrap(this.value)}`;
        }
    };

const Shift = <N extends string>(name: N, op: string) =>
    class {
        readonly name: N = name;
        readonly type?: string;
        readonly wrapped = true;

        constructor(readonly value: Expr, readonly shift: Expr) {}

        eval() {
            return this;
        }
        toString() {
            return `${wrap(this.value)} ${op} ${wrap(this.shift)}`;
        }
    };

export class Add extends Bin('Add', '+') {
    eval(): Expr {
        const left = evalExpr(this.left);
        const right = evalExpr(this.right);
        return isBigInt(left) && isBigInt(right)
            ? left + right
            : isZero(left)
            ? right
            : isZero(right)
            ? left
            : new Add(left, right);
    }
}

export class Mul extends Bin('Mul', '*') {
    eval() {
        return this;
    }
}
export class Sub extends Bin('Sub', '-') {
    eval(): Expr {
        const left = evalExpr(this.left);
        const right = evalExpr(this.right);
        return isBigInt(left) && isBigInt(right)
            ? left - right
            : isZero(right)
            ? left
            : new Sub(left, right);
    }
}

export class Div extends Bin('Div', '/') {
    eval(): Expr {
        const left = evalExpr(this.left);
        const right = evalExpr(this.right);
        return isBigInt(left) && isBigInt(right)
            ? right === 0n
                ? new Div(left, right)
                : left / right
            : isBigInt(right) && right === 1n
            ? left
            : new Div(left, right);
    }
}
export class Mod extends Bin('Mod', '%') {
    eval() {
        return this;
    }
}
export class Exp extends Bin('Exp', '**') {
    eval(): Expr {
        const left = evalExpr(this.left);
        const right = evalExpr(this.right);
        return isBigInt(left) && isBigInt(right) && right >= 0
            ? left ** right
            : new Exp(left, right);
    }
}

export class Sig {
    readonly name = 'Sig';
    readonly wrapped = false;
    readonly type?: string;

    constructor(readonly hash: string) {}

    eval() {
        return this;
    }
    toString() {
        return `msg.sig == ${this.hash}`;
    }
}

export class Eq extends Bin('Eq', '==') {
    eval(): Expr {
        return new Eq(evalExpr(this.left), evalExpr(this.right));
    }
}
export class And extends Bin('And', '&&') {
    eval(): Expr {
        const left = evalExpr(this.left);
        const right = evalExpr(this.right);

        return isBigInt(left) && isBigInt(right)
            ? left & right
            : isBigInt(left) && /^[f]+$/.test(left.toString(16))
            ? right
            : isBigInt(right) && /^[f]+$/.test(right.toString(16))
            ? left
            : isBigInt(left) && right instanceof And && isBigInt(right.left) && left === right.left
            ? right.right
            : new And(left, right);
    }
}

export class Or extends Bin('Or', '||') {
    eval() {
        return this;
    }
}

export class IsZero {
    readonly name = 'IsZero';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: Expr) {}

    eval(): Expr {
        const value = evalExpr(this.value);

        return isBigInt(value)
            ? value === 0n
                ? 1n
                : 0n
            : value instanceof LT
            ? new GT(value.left, value.right, !value.equal)
            : value instanceof GT
            ? new LT(value.left, value.right, !value.equal)
            : value instanceof IsZero
            ? value.value
            : new IsZero(value);
    }
    toString() {
        return this.value instanceof Eq
            ? wrap(this.value.left) + ' != ' + wrap(this.value.right)
            : wrap(this.value) + ' == 0';
    }
}

export const Cmp = <N extends string>(name: N, op: string) =>
    class extends Name(name, true) {
        readonly type?: string;
        constructor(readonly left: Expr, readonly right: Expr, readonly equal: boolean = false) {
            super();
        }

        override toString() {
            return wrap(this.left) + (this.equal ? ` ${op}= ` : ` ${op} `) + wrap(this.right);
        }
    };

export class GT extends Cmp('Gt', '>') {
    eval(): Expr {
        const left = evalExpr(this.left);
        const right = evalExpr(this.right);
        return isBigInt(left) && isBigInt(right) ? (left > right ? 1n : 0n) : new GT(left, right);
    }
}
export class LT extends Cmp('Lt', '<') {
    eval(): Expr {
        const left = evalExpr(this.left);
        const right = evalExpr(this.right);
        return isBigInt(left) && isBigInt(right) ? (left < right ? 1n : 0n) : new LT(left, right);
    }
}

export class Xor extends Bin('Xor', '^') {
    eval() {
        return this;
    }
}
export class Not extends Unary('Not', '~') {}
export class Neg extends Unary(null, '!') {}

export class Byte {
    readonly name = 'BYTE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly position: Expr, readonly data: Expr) {}

    eval() {
        return this;
    }
    toString() {
        return `(${wrap(this.data)} >> ${wrap(this.position)}) & 1`;
    }
}

export class Shl extends Shift('Shl', '<<') {}
export class Shr extends Shift('Shr', '>>>') {}
export class Sar extends Shift('Sar', '>>') {}

// Memory
export class MLoad {
    readonly name = 'MLOAD';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: Expr) {}

    eval() {
        return this;
    }
    toString() {
        return 'memory[' + wrap(this.location) + ']';
    }
}

export class MStore {
    readonly name = 'MSTORE';
    readonly type?: string;

    constructor(readonly location: Exclude<Expr, bigint>, readonly data: Expr) {}

    eval() {
        return this;
    }

    toString() {
        return 'memory[' + wrap(this.location) + '] = ' + wrap(this.data) + ';';
    }
}

export class Sha3 {
    readonly name = 'SHA3';
    readonly type?: string;
    readonly wrapped = false;

    constructor(
        readonly items: Expr[],
        readonly memoryStart?: Expr,
        readonly memoryLength?: Expr
    ) {}

    eval(): Expr {
        return new Sha3(this.items.map(evalExpr), this.memoryStart, this.memoryLength);
    }

    toString() {
        if (this.memoryStart && this.memoryLength) {
            return `keccak256(memory[${wrap(this.memoryStart)}:(${wrap(this.memoryStart)}+${wrap(
                this.memoryLength!
            )})])`;
        } else {
            return `keccak256(${this.items.map(item => wrap(item)).join(', ')})`;
        }
    }
}

export type Info =
    | 'this'
    | 'tx.origin'
    | 'msg.sender'
    | 'this.code.length'
    | 'tx.gasprice'
    | 'output.length'
    | 'block.coinbase'
    | 'block.timestamp'
    | 'block.number'
    | 'block.difficulty'
    | 'block.gaslimit'
    | 'chainid'
    | 'self.balance'
    | 'memory.length'
    | 'gasleft()';

export class Symbol0 {
    readonly name = 'Symbol0';
    readonly wrapped = false;
    constructor(readonly symbol: Info, readonly type?: string) {}
    eval() {
        return this;
    }
    toString() {
        return this.symbol;
    }
}
export class Symbol1 {
    readonly name = 'Symbol1';
    readonly type?: string;
    readonly wrapped = false;
    constructor(readonly fn: (value: string) => string, readonly value: Expr) {}
    eval(): Expr {
        return new Symbol1(this.fn, evalExpr(this.value));
    }
    toString() {
        return this.fn(wrap(this.value));
    }
}

export class DataCopy {
    readonly name = 'DataCopy';
    readonly type?: string;
    readonly wrapped = false;
    constructor(
        readonly fn: (offset: string, size: string) => string,
        readonly offset: Expr,
        readonly size: Expr
    ) {}
    eval() {
        return this;
    }
    toString() {
        return this.fn(wrap(this.offset), wrap(this.size));
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

export class CREATE {
    readonly type = 'address';
    readonly wrapped = true;

    constructor(readonly memoryStart: Expr, readonly memoryLength: Expr, readonly value: Expr) {}

    eval() {
        return this;
    }
    toString() {
        return `(new Contract(memory[${wrap(this.memoryStart)}:(${wrap(this.memoryStart)}+${wrap(
            this.memoryLength
        )})]).value(${wrap(this.value)})).address`;
    }
}

export class CALL {
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
    ) {}

    eval() {
        return this;
    }
    toString() {
        if (isZero(this.memoryLength) && isZero(this.outputLength)) {
            if (
                this.gas instanceof Mul &&
                this.gas.left instanceof IsZero &&
                isBigInt(this.gas.right) &&
                this.gas.right === 2300n
            ) {
                if (this.throwOnFail) {
                    return `address(${wrap(this.address)}).transfer(${wrap(this.value)})`;
                } else {
                    return `address(${wrap(this.address)}).send(${wrap(this.value)})`;
                }
            } else {
                return `address(${wrap(this.address)}).call.gas(${wrap(this.gas)}).value(${wrap(
                    this.value
                )})`;
            }
        } else {
            return `call(${wrap(this.gas)},${wrap(this.address)},${wrap(this.value)},${wrap(
                this.memoryStart
            )},${wrap(this.memoryLength)},${wrap(this.outputStart)},${wrap(this.outputLength)})`;
        }
    }
}

export class ReturnData {
    readonly name = 'ReturnData';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly retOffset: any, readonly retSize: any) {}

    eval() {
        return this;
    }
    toString() {
        return `output:ReturnData:${this.retOffset}:${this.retSize}`;
    }
}
export class CALLCODE {
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
    ) {}

    eval() {
        return this;
    }
    toString() {
        return `callcode(${wrap(this.gas)},${wrap(this.address)},${wrap(this.value)},${wrap(
            this.memoryStart
        )},${wrap(this.memoryLength)},${wrap(this.outputStart)},${wrap(this.outputLength)})`;
    }
}

export class CREATE2 {
    readonly name = 'CREATE2';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly memoryStart: Expr, readonly memoryLength: Expr, readonly value: Expr) {}

    eval() {
        return this;
    }
    toString() {
        return `(new Contract(memory[${wrap(this.memoryStart)}:(${wrap(this.memoryStart)}+${wrap(
            this.memoryLength
        )})]).value(${wrap(this.value)})).address`;
    }
}

export class STATICCALL {
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
    ) {}

    eval() {
        return this;
    }
    toString() {
        return `staticcall(${wrap(this.gas)},${wrap(this.address)},${wrap(this.memoryStart)},${wrap(
            this.memoryLength
        )},${wrap(this.outputStart)},${wrap(this.outputLength)})`;
    }
}

export class DELEGATECALL {
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
    ) {}

    eval() {
        return this;
    }
    toString() {
        return `delegatecall(${wrap(this.gas)},${wrap(this.address)},${wrap(
            this.memoryStart
        )},${wrap(this.memoryLength)},${wrap(this.outputStart)},${wrap(this.outputLength)})`;
    }
}

export function evalExpr(expr: Expr) {
    return typeof expr === 'bigint' ? expr : expr.eval();
}

export class Return {
    readonly name = 'Return';
    readonly wrapped = true;

    constructor(readonly args: Expr[], readonly memoryStart?: Expr, readonly memoryLength?: Expr) {}

    eval() {
        return new Return(this.args.map(evalExpr), this.memoryStart, this.memoryLength);
    }

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
            return `revert(memory[${wrap(this.memoryStart!)}:(${wrap(this.memoryStart!)}+${wrap(
                this.memoryLength!
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

export class CallDataLoad {
    readonly name = 'CALLDATALOAD';
    type?: string;
    readonly wrapped = false;

    constructor(public location: Expr) {}

    eval(): Expr {
        this.location = evalExpr(this.location);
        return this;
    }
    toString(): string {
        if (isBigInt(this.location) && isZero(this.location)) {
            return 'msg.data';
        } else if (isBigInt(this.location) && (this.location - 4n) % 32n === 0n) {
            return `_arg${(this.location - 4n) / 32n}`;
        } else {
            return `msg.data[${wrap(this.location)}]`;
        }
    }
}

export class CALLDATASIZE {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    eval() {
        return this;
    }
    toString() {
        return 'msg.data.length';
    }
}

export class CallValue {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    eval() {
        return this;
    }
    toString() {
        return 'msg.value';
    }
}

export class Log {
    readonly name = 'LOG';
    readonly type?: string;
    readonly wrapped = true;
    readonly eventName?: string;

    constructor(
        private readonly eventHashes: { [s: string]: string },
        readonly topics: Expr[],
        readonly args: Expr[],
        readonly memoryStart?: Expr,
        readonly memoryLength?: Expr
    ) {
        if (
            this.topics.length > 0 &&
            isBigInt(this.topics[0]) &&
            this.topics[0].toString(16) in eventHashes
        ) {
            this.eventName = eventHashes[this.topics[0].toString(16)].split('(')[0];
            this.topics.shift();
        }
    }

    eval() {
        return new Log(
            this.eventHashes,
            this.topics.map(evalExpr),
            this.args.map(evalExpr),
            this.memoryStart ? evalExpr(this.memoryStart) : undefined,
            this.memoryLength ? evalExpr(this.memoryLength) : undefined
        );
    }

    toString() {
        return this.eventName
            ? `emit ${this.eventName}(${[...this.topics, ...this.args].join(', ')});`
            : 'log(' +
                  (this.memoryStart && this.memoryLength
                      ? [
                            ...this.topics,
                            `memory[${this.memoryStart.toString()}:${this.memoryLength.toString()} ]`,
                        ].join(', ') + 'ii'
                      : [...this.topics, ...this.args].join(', ')) +
                  ');';
    }
}

export class MappingStore {
    readonly type?: string;
    readonly wrapped = false;

    constructor(
        readonly mappings: any,
        readonly location: any,
        readonly items: any,
        readonly data: any,
        readonly count: any,
        readonly structlocation?: any
    ) {}

    eval() {
        return this;
    }

    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        if (this.location in this.mappings() && this.mappings()[this.location].name) {
            mappingName = this.mappings()[this.location].name;
        }
        if (
            this.data.name === 'ADD' &&
            this.data.right.name === 'MappingLoad' &&
            wrap(this.data.right.location) === wrap(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + wrap(item) + ']').join('') +
                ' += ' +
                wrap(this.data.left) +
                ';'
            );
        } else if (
            this.data.name === 'ADD' &&
            this.data.left.name === 'MappingLoad' &&
            wrap(this.data.left.location) === wrap(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + wrap(item) + ']').join('') +
                ' += ' +
                wrap(this.data.right) +
                ';'
            );
        } else if (
            this.data.name === 'SUB' &&
            this.data.left.name === 'MappingLoad' &&
            wrap(this.data.left.location) === wrap(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + wrap(item) + ']').join('') +
                ' -= ' +
                wrap(this.data.right) +
                ';'
            );
        } else {
            return (
                mappingName +
                this.items.map((item: any) => '[' + wrap(item) + ']').join('') +
                ' = ' +
                wrap(this.data) +
                ';'
            );
        }
    }
}

export class SStore {
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly location: Expr,
        readonly data: Expr,
        readonly variables: Contract['variables']
    ) {
        // if (isVal(this.location)) {
        //     const loc = this.location.toString();
        //     if (loc in this.variables) {
        //         this.variables[loc].types.push(this.data.type);
        //     } else {
        //         this.variables[loc] = new Variable(undefined, [this.data.type]);
        //     }
        // }
    }

    eval() {
        return new SStore(evalExpr(this.location), evalExpr(this.data), this.variables);
    }

    toString() {
        let variableName = 'storage[' + wrap(this.location) + ']';
        const loc = this.location.toString();
        if (isBigInt(this.location) && loc in this.variables) {
            const label = this.variables[loc].label;
            if (label) {
                variableName = label;
            } else {
                variableName = 'var' + (Object.keys(this.variables).indexOf(loc) + 1);
            }
        }
        if (
            this.data instanceof Add &&
            this.data.right instanceof SLoad &&
            wrap(this.data.right.location) === wrap(this.location)
        ) {
            return variableName + ' += ' + wrap(this.data.left) + ';';
        } else if (
            this.data instanceof Sub &&
            this.data.left instanceof SLoad &&
            wrap(this.data.left.location) === wrap(this.location)
        ) {
            return variableName + ' -= ' + wrap(this.data.right) + ';';
        } else {
            return variableName + ' = ' + wrap(this.data) + ';';
        }
    }
}

export class MappingLoad {
    readonly name = 'MappingLoad';
    readonly type?: string;
    readonly wrapped = false;

    constructor(
        readonly mappings: () => {
            [location: number]: Contract['mappings'][keyof Contract['mappings']];
        },
        readonly location: number,
        readonly items: Expr[],
        readonly count: number,
        readonly structlocation?: bigint
    ) {}

    eval() {
        return this;
    }
    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        const maybeName = this.mappings()[this.location].name;
        if (this.location in this.mappings() && maybeName) {
            mappingName = maybeName;
        }
        if (this.structlocation) {
            return (
                mappingName +
                this.items.map(item => '[' + wrap(item) + ']').join('') +
                '[' +
                this.structlocation.toString() +
                ']'
            );
        } else {
            return mappingName + this.items.map(item => '[' + wrap(item) + ']').join('');
        }
    }
}

export class SLoad {
    readonly name = 'SLOAD';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly location: Expr, readonly variables: Contract['variables']) {}

    eval(): Expr {
        return new SLoad(evalExpr(this.location), this.variables);
    }

    toString() {
        if (isBigInt(this.location) && this.location.toString() in this.variables) {
            const label = this.variables[this.location.toString()].label;
            if (label) {
                return label;
            } else {
                return 'var' + (Object.keys(this.variables).indexOf(this.location.toString()) + 1);
            }
        } else {
            return 'storage[' + wrap(this.location) + ']';
        }
    }
}

export class If {
    readonly name = 'If';
    readonly wrapped = true;
    constructor(
        readonly condition: Expr,
        readonly trueBlock?: Stmt[],
        readonly falseBlock?: Stmt[]
    ) {}
    toString() {
        return '(' + this.condition + ')';
    }
    eval() {
        return this;
    }
}

export class Jumpi {
    readonly name = 'Jumpi';
    readonly wrapped = true;
    constructor(
        readonly condition: Expr,
        readonly offset: Expr,
        readonly fallBranch: Branch,
        readonly destBranch: Branch
    ) {}
    eval() {
        return this;
    }
    toString() {
        return 'if (' + this.condition + ')';
    }
}

export class SigCase {
    readonly name = 'SigCase';
    readonly wrapped = true;
    constructor(readonly condition: Sig, readonly fallBranch: Branch) {}
    eval() {
        return this;
    }
    toString() {
        return 'ifsig (' + this.condition + ')';
    }
}

export class Jump {
    readonly name = 'Jump';
    readonly wrapped = true;
    constructor(readonly offset: Expr, readonly destBranch: Branch) {}
    eval() {
        return this;
    }
    toString() {
        return 'go ' + this.offset.toString();
    }
}

export class JumpDest {
    readonly name = 'JumpDest';
    readonly wrapped = true;
    constructor(readonly fallBranch: Branch) {}
    eval() {
        return this;
    }
    toString() {
        return 'fall';
    }
}

export class Require {
    readonly name = 'Require';

    constructor(readonly condition: Expr, readonly args: Expr[]) {}

    eval() {
        return this;
    }

    toString() {
        return `require(${wrap(this.condition)}, ${this.args.join(', ')});`;
    }
}

export class CallSite {
    readonly name = 'CallSite';
    readonly wrapped = true;
    constructor(readonly hash: string) {}
    eval() {
        return this;
    }
    toString() {
        return '#' + this.hash + '();';
    }
}
