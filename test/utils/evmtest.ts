import { EVM } from '../../src';
import * as functionHashes from '../../data/functionHashes.json';
import * as eventHashes from '../../data/eventHashes.json';

export class Sym {
    readonly name = 'SYMBOL';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'x';
    }
}

export default class extends EVM {
    constructor(code: string | Buffer) {
        super(code, functionHashes, eventHashes);
    }
}
