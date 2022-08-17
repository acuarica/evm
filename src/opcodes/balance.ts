import stringify from '../utils/stringify';

export class BALANCE {
    readonly name = 'BALANCE';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly address: any) {}

    toString() {
        return `${stringify(this.address)}.balance`;
    }
}
