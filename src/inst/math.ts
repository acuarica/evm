import stringify from '../utils/stringify';

export class Add {
    readonly name = 'ADD';
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString = () => `${stringify(this.left)} + ${stringify(this.right)}`;

    get type() {
        if (this.left.type === this.right.type) {
            return this.left.type;
        } else if (!this.left.type && this.right.type) {
            return this.right.type;
        } else if (!this.right.type && this.left.type) {
            return this.left.type;
        } else {
            return false;
        }
    }
}

export class Mul {
    readonly name = 'MUL';
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString = () => `${stringify(this.left)} * ${stringify(this.right)}`;
}

export class Sub {
    readonly name = 'SUB';
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString = () => `${stringify(this.left)} - ${stringify(this.right)}`;
}

export class Div {
    readonly name = 'DIV';
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString = () => `${stringify(this.left)} / ${stringify(this.right)}`;
}
