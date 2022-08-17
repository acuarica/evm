import stringify from '../utils/stringify';

export class MLOAD {
    readonly name = 'MLOAD';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: any) {}

    toString() {
        return 'memory[' + stringify(this.location) + ']';
    }
}
