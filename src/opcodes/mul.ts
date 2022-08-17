import stringify from '../utils/stringify';

export class Mul {
    readonly name = 'MUL';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' * ' + stringify(this.right);
    }
}
