import { Operand } from '../evm';
import { EQ } from '../opcodes/eq';
import stringify from '../utils/stringify';

export class OR {
    readonly name = 'OR';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString = () => stringify(this.left) + ' || ' + stringify(this.right);
}

export class IsZero {
    readonly name = 'ISZERO';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: Operand) {}

    toString() {
        return this.value instanceof EQ
            ? stringify(this.value.left) + ' != ' + stringify(this.value.right)
            : stringify(this.value) + ' == 0';
    }
}

export class GT {
    readonly name = 'GT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' >= ' : ' > ') + stringify(this.right);
    }
}

export class LT {
    readonly name = 'LT';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' <= ' : ' < ') + stringify(this.right);
    }
}

/**
 * https://www.evm.codes/#18
 */
export class Xor {
    readonly name = 'XOR';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} ^ ${stringify(this.right)}`;
}

/**
 * https://www.evm.codes/#19
 */
export class Not {
    readonly name = 'NOT';
    readonly wrapped = true;

    constructor(readonly value: Operand) {}

    toString = () => `~${stringify(this.value)}`;
}

/**
 * https://www.evm.codes/#1a
 */
export class Byte {
    readonly name = 'BYTE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly position: Operand, readonly data: Operand) {}

    toString = () => `(${stringify(this.data)} >> ${stringify(this.position)}) & 1`;
}

/**
 * https://www.evm.codes/#1b
 */
export class Shl {
    readonly name = 'SHL';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} << ${stringify(this.shift)}`;
}

/**
 * https://www.evm.codes/#1c
 */
export class Shr {
    readonly name = 'SHR';
    readonly wrapped = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} >>> ${stringify(this.shift)}`;
}

/**
 * https://www.evm.codes/#1d
 */
export class Sar {
    readonly name = 'SAR';
    readonly wrapped = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} >> ${stringify(this.shift)}`;
}

export class SHA3 {
    readonly name = 'SHA3';
    readonly type?: string;
    readonly wrapped = false;
    readonly memoryStart?: Operand;
    readonly memoryLength?: Operand;
    readonly items?: Operand[];

    constructor(items: Operand[], memoryStart?: Operand, memoryLength?: Operand) {
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
