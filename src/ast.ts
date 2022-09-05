import { type Contract } from './contract';
import { hex2a } from './hex';

/**
 *
 */
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

export const Name = <N extends string>(name: N, wrapped: boolean) =>
    class {
        readonly name: N = name;
        readonly wrapped = wrapped;
    };

export const Bin = <N extends string>(name: N, op: string) =>
    class extends Name(name, true) {
        constructor(readonly left: Expr, readonly right: Expr) {
            super();
        }

        override toString() {
            return `${stringify(this.left)} ${op} ${stringify(this.right)}`;
        }
    };

export class Add extends Bin('Add', '+') {}
export class Mul extends Bin('Mul', '*') {}
export class Sub extends Bin('Sub', '-') {}
export class Div extends Bin('Div', '/') {}
export class Mod extends Bin('Mod', '%') {}
export class Exp extends Bin('Exp', '**') {}

export class Sig {
    readonly name = 'Sig';
    readonly wrapped = false;

    constructor(readonly hash: string) {}

    toString() {
        return `msg.sig == ${this.hash}`;
    }
}
const Unary = <N extends string | null>(name: N, op: string) =>
    class {
        readonly name: N = name;
        readonly wrapped = false;

        constructor(readonly value: Expr) {}

        toString() {
            return `${op}${stringify(this.value)}`;
        }
    };

const Shift = <N extends string>(name: N, op: string) =>
    class {
        readonly name: N = name;
        readonly type?: string;
        readonly wrapped = true;

        constructor(readonly value: Expr, readonly shift: Expr) {}

        toString() {
            return `${stringify(this.value)} ${op} ${stringify(this.shift)}`;
        }
    };

export class Eq extends Bin('Eq', '==') {}
export class And extends Bin('And', '&&') {}
export class Or extends Bin('Or', '||') {}

export class IsZero {
    readonly name = 'IsZero';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: Expr) {}

    toString() {
        return this.value instanceof Eq
            ? stringify(this.value.left) + ' != ' + stringify(this.value.right)
            : stringify(this.value) + ' == 0';
    }
}

export class GT {
    readonly name = 'Gt';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Expr, readonly right: Expr, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' >= ' : ' > ') + stringify(this.right);
    }
}

export class LT {
    readonly name = 'Lt';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Expr, readonly right: Expr, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' <= ' : ' < ') + stringify(this.right);
    }
}

export class Xor extends Bin('Xor', '^') {}
export class Not extends Unary('Not', '~') {}
export class Neg extends Unary(null, '!') {}

export class Byte {
    readonly name = 'BYTE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly position: Expr, readonly data: Expr) {}

    toString() {
        return `(${stringify(this.data)} >> ${stringify(this.position)}) & 1`;
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

    toString() {
        return 'memory[' + stringify(this.location) + ']';
    }
}

export class MStore {
    readonly name = 'MSTORE';
    readonly type?: string;

    constructor(readonly location: Exclude<Expr, bigint>, readonly data: Expr) {}

    toString() {
        return 'memory[' + stringify(this.location) + '] = ' + stringify(this.data) + ';';
    }
}

export class Sha3 {
    readonly name = 'SHA3';
    readonly type?: string;
    readonly wrapped = false;
    readonly memoryStart?: Expr;
    readonly memoryLength?: Expr;
    readonly items?: Expr[];

    constructor(items: Expr[], memoryStart?: Expr, memoryLength?: Expr) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = items;
        }
    }

    toString() {
        if (this.items) {
            return `keccak256(${this.items.map(item => stringify(item)).join(', ')})`;
        } else {
            return `keccak256(memory[${stringify(this.memoryStart!)}:(${stringify(
                this.memoryStart!
            )}+${stringify(this.memoryLength!)})])`;
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
    | 'memory.length'
    | 'gasleft()';

export class Symbol0 {
    readonly name = 'Symbol0';
    readonly wrapped = false;
    constructor(readonly symbol: Info, readonly type?: string) {}
    toString() {
        return this.symbol;
    }
}
export class Symbol1 {
    readonly name = 'Symbol1';
    readonly wrapped = false;
    constructor(readonly fn: (value: string) => string, readonly value: Expr) {}
    toString() {
        return this.fn(stringify(this.value));
    }
}

export class DataCopy {
    readonly name = 'DataCopy';
    readonly wrapped = false;
    constructor(
        readonly fn: (offset: string, size: string) => string,
        readonly offset: Expr,
        readonly size: Expr
    ) {}
    toString() {
        return this.fn(stringify(this.offset), stringify(this.size));
    }
}

export class Stop {
    readonly name = 'Stop';
    toString() {
        return 'return;';
    }
}

export class CREATE {
    readonly type = 'address';
    readonly wrapped = true;

    constructor(readonly memoryStart: Expr, readonly memoryLength: Expr, readonly value: Expr) {}

    toString() {
        return (
            '(new Contract(memory[' +
            stringify(this.memoryStart) +
            ':(' +
            stringify(this.memoryStart) +
            '+' +
            stringify(this.memoryLength) +
            ')]).value(' +
            stringify(this.value) +
            ')).address'
        );
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

    toString() {
        if (isZero(this.memoryLength) && isZero(this.outputLength)) {
            if (
                this.gas instanceof Mul &&
                this.gas.left instanceof IsZero &&
                isBigInt(this.gas.right) &&
                this.gas.right === 2300n
            ) {
                if (this.throwOnFail) {
                    return (
                        'address(' +
                        stringify(this.address) +
                        ').transfer(' +
                        stringify(this.value) +
                        ')'
                    );
                } else {
                    return (
                        'address(' +
                        stringify(this.address) +
                        ').send(' +
                        stringify(this.value) +
                        ')'
                    );
                }
            } else {
                return (
                    'address(' +
                    stringify(this.address) +
                    ').call.gas(' +
                    stringify(this.gas) +
                    ').value(' +
                    stringify(this.value) +
                    ')'
                );
            }
        } else {
            return (
                'call(' +
                stringify(this.gas) +
                ',' +
                stringify(this.address) +
                ',' +
                stringify(this.value) +
                ',' +
                stringify(this.memoryStart) +
                ',' +
                stringify(this.memoryLength) +
                ',' +
                stringify(this.outputStart) +
                ',' +
                stringify(this.outputLength) +
                ')'
            );
        }
    }
}

export class ReturnData {
    readonly name = 'ReturnData';
    readonly wrapped = false;

    constructor(readonly retOffset: any, readonly retSize: any) {}

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

    toString() {
        return (
            'callcode(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.value) +
            ',' +
            stringify(this.memoryStart) +
            ',' +
            stringify(this.memoryLength) +
            ',' +
            stringify(this.outputStart) +
            ',' +
            stringify(this.outputLength) +
            ')'
        );
    }
}

export class CREATE2 {
    readonly name = 'CREATE2';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly memoryStart: Expr, readonly memoryLength: Expr, readonly value: Expr) {}

    toString() {
        return (
            '(new Contract(memory[' +
            stringify(this.memoryStart) +
            ':(' +
            stringify(this.memoryStart) +
            '+' +
            stringify(this.memoryLength) +
            ')]).value(' +
            stringify(this.value) +
            ')).address'
        );
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

    toString() {
        return (
            'staticcall(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.memoryStart) +
            ',' +
            stringify(this.memoryLength) +
            ',' +
            stringify(this.outputStart) +
            ',' +
            stringify(this.outputLength) +
            ')'
        );
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

    toString() {
        return (
            'delegatecall(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.memoryStart) +
            ',' +
            stringify(this.memoryLength) +
            ',' +
            stringify(this.outputStart) +
            ',' +
            stringify(this.outputLength) +
            ')'
        );
    }
}

export class Return {
    readonly name = 'Return';
    readonly wrapped = true;
    readonly memoryStart?: Expr;
    readonly memoryLength?: Expr;

    constructor(readonly args: Expr[], memoryStart?: Expr, memoryLength?: Expr) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        }
    }

    toString(): string {
        if (this.memoryStart && this.memoryLength) {
            return (
                'return memory[' +
                stringify(this.memoryStart) +
                ':(' +
                stringify(this.memoryStart) +
                '+' +
                stringify(this.memoryLength) +
                ')];'
            );
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
                ? `return ${stringify(this.args[0])};`
                : `return (${this.args.map(item => stringify(item)).join(', ')});`;
        }
    }
}

export class Revert {
    readonly name = 'REVERT';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: Expr;
    readonly memoryLength?: Expr;
    readonly items?: Expr[];

    constructor(items: Expr[], memoryStart?: Expr, memoryLength?: Expr) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = items;
        }
    }

    toString() {
        if (this.items) {
            return 'revert(' + this.items.map(item => stringify(item)).join(', ') + ');';
        } else {
            return `revert(memory[${stringify(this.memoryStart!)}:(${stringify(
                this.memoryStart!
            )}+${stringify(this.memoryLength!)})]);`;
        }
    }
}

export class Invalid {
    readonly name = 'Invalid';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly opcode: any) {}

    toString = () => `revert("Invalid instruction (0x${this.opcode.toString(16)})");`;
}

export class SelfDestruct {
    readonly name = 'SELFDESTRUCT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly address: any) {}

    toString = () => `selfdestruct(${stringify(this.address)});`;
}

export class CallDataLoad {
    readonly name = 'CALLDATALOAD';
    // readonly type = 'bytes32';
    readonly wrapped = false;

    constructor(readonly location: Expr) {}

    toString(): string {
        if (isBigInt(this.location) && isZero(this.location)) {
            return 'msg.data';
        } else if (isBigInt(this.location) && (this.location - 4n) % 32n === 0n) {
            return `_arg${(this.location - 4n) / 32n}`;
        } else {
            return `msg.data[${stringify(this.location)}]`;
        }
    }
}

export class CALLDATASIZE {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'msg.data.length';
    }
}

export class CallValue {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'msg.value';
    }
}

export class Log {
    readonly name = 'LOG';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items?: any;
    readonly eventName?: string;

    constructor(
        eventHashes: { [s: string]: string },
        readonly topics: Expr[],
        args?: Expr[],
        memoryStart?: Expr,
        memoryLength?: Expr
    ) {
        if (
            this.topics.length > 0 &&
            isBigInt(this.topics[0]) &&
            this.topics[0].toString(16) in eventHashes
        ) {
            this.eventName = eventHashes[this.topics[0].toString(16)].split('(')[0];
            this.topics.shift();
        }
        if (this.memoryStart && this.memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = args;
        }
    }

    toString() {
        if (this.eventName) {
            return (
                'emit ' + this.eventName + '(' + [...this.topics, ...this.items].join(', ') + ');'
            );
        } else {
            return 'log(' + [...this.topics, ...this.items].join(', ') + ');';
        }
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

    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        if (this.location in this.mappings() && this.mappings()[this.location].name) {
            mappingName = this.mappings()[this.location].name;
        }
        if (
            this.data.name === 'ADD' &&
            this.data.right.name === 'MappingLoad' &&
            stringify(this.data.right.location) === stringify(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' += ' +
                stringify(this.data.left) +
                ';'
            );
        } else if (
            this.data.name === 'ADD' &&
            this.data.left.name === 'MappingLoad' &&
            stringify(this.data.left.location) === stringify(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' += ' +
                stringify(this.data.right) +
                ';'
            );
        } else if (
            this.data.name === 'SUB' &&
            this.data.left.name === 'MappingLoad' &&
            stringify(this.data.left.location) === stringify(this.location)
        ) {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' -= ' +
                stringify(this.data.right) +
                ';'
            );
        } else {
            return (
                mappingName +
                this.items.map((item: any) => '[' + stringify(item) + ']').join('') +
                ' = ' +
                stringify(this.data) +
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

    toString() {
        let variableName = 'storage[' + stringify(this.location) + ']';
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
            stringify(this.data.right.location) === stringify(this.location)
        ) {
            return variableName + ' += ' + stringify(this.data.left) + ';';
        } else if (
            this.data instanceof Sub &&
            this.data.left instanceof SLoad &&
            stringify(this.data.left.location) === stringify(this.location)
        ) {
            return variableName + ' -= ' + stringify(this.data.right) + ';';
        } else {
            return variableName + ' = ' + stringify(this.data) + ';';
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

    toString() {
        let mappingName = 'mapping' + (this.count + 1);
        const maybeName = this.mappings()[this.location].name;
        if (this.location in this.mappings() && maybeName) {
            mappingName = maybeName;
        }
        if (this.structlocation) {
            return (
                mappingName +
                this.items.map(item => '[' + stringify(item) + ']').join('') +
                '[' +
                this.structlocation.toString() +
                ']'
            );
        } else {
            return mappingName + this.items.map(item => '[' + stringify(item) + ']').join('');
        }
    }
}

export class SLoad {
    readonly name = 'SLOAD';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly location: Expr, readonly variables: Contract['variables']) {}

    toString() {
        if (isBigInt(this.location) && this.location.toString() in this.variables) {
            const label = this.variables[this.location.toString()].label;
            if (label) {
                return label;
            } else {
                return 'var' + (Object.keys(this.variables).indexOf(this.location.toString()) + 1);
            }
        } else {
            return 'storage[' + stringify(this.location) + ']';
        }
    }
}

export class Jumpi {
    readonly name = 'Jumpi';
    readonly wrapped = true;
    constructor(
        readonly condition: Expr,
        readonly offset: Expr,
        readonly fallBranch?: string,
        readonly destBranch?: string
    ) {}
    toString() {
        // return 'if (' + this.condition + ') // goto ' + this.offset.toString();
        return 'if (' + this.condition + ')';
    }
}

export class Jump {
    readonly name = 'Jump';
    readonly wrapped = true;
    constructor(readonly offset: Expr, readonly destBranch?: string) {}
    toString() {
        return 'go ' + this.offset.toString();
    }
}
