import stringify from '../utils/stringify';

export class MSTORE {
    readonly name = 'MSTORE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly location: any, readonly data: any) {}

    toString() {
        return 'memory[' + stringify(this.location) + '] = ' + stringify(this.data) + ';';
    }
}
