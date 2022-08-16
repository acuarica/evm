import stringify from '../utils/stringify';

export class XOR {
    readonly name = 'XOR';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' ^ ' + stringify(this.right);
    }
}
