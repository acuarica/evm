import stringify from '../utils/stringify';

export class Add {
    readonly name = 'ADD';
    readonly wrapped = true;

    constructor(readonly left: any, readonly right: any) {}

    toString() {
        return stringify(this.left) + ' + ' + stringify(this.right);
    }

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
