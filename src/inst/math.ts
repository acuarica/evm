import { Operand } from '../evm';
import stringify from '../utils/stringify';

/**
 * https://www.evm.codes/#00
 */
export class Stop {
    readonly name = 'STOP';
    readonly wrapped = false;

    toString = () => 'return;';
}

export class Add {
    readonly name = 'ADD';
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    // get type() {
    //     if (this.left.type === this.right.type) {
    //         return this.left.type;
    //     } else if (!this.left.type && this.right.type) {
    //         return this.right.type;
    //     } else if (!this.right.type && this.left.type) {
    //         return this.left.type;
    //     } else {
    //         return false;
    //     }
    // }

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

export class Mod {
    readonly name = 'MOD';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => `${stringify(this.left)} % ${stringify(this.right)}`;
}

export class Exp {
    readonly name = 'EXP';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Operand, readonly right: Operand) {}

    toString = () => stringify(this.left) + ' ** ' + stringify(this.right);
}
