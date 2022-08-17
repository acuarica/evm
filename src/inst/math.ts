import { Operand } from '../evm';
import stringify from '../utils/stringify';

export class Add {
    readonly name = 'ADD';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} + ${stringify(this.right)}`;
}

export class Mul {
    readonly name = 'MUL';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} * ${stringify(this.right)}`;
}

export class Sub {
    readonly name = 'SUB';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} - ${stringify(this.right)}`;
}

export class Div {
    readonly name = 'DIV';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} / ${stringify(this.right)}`;
}
