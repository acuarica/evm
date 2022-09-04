import { stringify } from './inst/utils';

export class Val {
    readonly name = 'Val';
    readonly wrapped = false;
    constructor(readonly val: bigint) {}

    toString() {
        return this.val;
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

const Bin = <N extends string>(name: N, op: string) =>
    class {
        readonly name: N = name;
        readonly wrapped = true;

        constructor(readonly left: Expr, readonly right: Expr) {}

        toString() {
            return `${stringify(this.left)} ${op} ${stringify(this.right)}`;
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

export class Eq extends Bin('Eq', '==') {}
export class And extends Bin('And', '&&') {}
export class Or extends Bin('Or', '||') {}

export class IsZero {
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly value: Expr) {}

    toString() {
        return this.value.name === 'Eq'
            ? stringify(this.value.left) + ' != ' + stringify(this.value.right)
            : stringify(this.value) + ' == 0';
    }
}

export class Gt {
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: Expr, readonly right: Expr, readonly equal: boolean = false) {}

    toString() {
        return stringify(this.left) + (this.equal ? ' >= ' : ' > ') + stringify(this.right);
    }
}

export class Lt {
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

export type Expr =
    | Val
    // Math
    | Add
    | Mul
    | Sub
    // Logic
    | Sig
    | Eq;

export class Stop {
    readonly name = 'Stop';
    toString() {
        return 'return;';
    }
}

export type Stmt = Stop;
