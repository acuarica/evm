import { Operand } from '../evm';
import stringify from '../utils/stringify';

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
