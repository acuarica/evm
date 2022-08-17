import { Operand } from '../evm';
import stringify from '../utils/stringify';

export class Shl {
    readonly name = 'SHL';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => stringify(this.value) + ' << ' + stringify(this.shift);
}

export class Shr {
    readonly name = 'SHR';
    readonly wrapped = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} >>> ${stringify(this.shift)}`;
}

export class Sar {
    readonly name = 'SAR';
    readonly wrapped = true;

    constructor(readonly value: Operand, readonly shift: Operand) {}

    toString = () => `${stringify(this.value)} >> ${stringify(this.shift)}`;
}
