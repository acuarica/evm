import stringify from '../utils/stringify';

export class BLOCKHASH {
    readonly name = 'BLOCKHASH';
    readonly wrapped = true;

    constructor(readonly blockNumber: any) {}

    toString() {
        return 'block.blockhash(' + stringify(this.blockNumber) + ')';
    }
}
