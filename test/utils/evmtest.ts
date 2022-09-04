import { EVM } from '../../src';
import * as functionHashes from '../../data/functionHashes.json';
import * as eventHashes from '../../data/eventHashes.json';

export class Sym {
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly sym: string) {}

    toString() {
        return this.sym;
    }
}

export default class extends EVM {
    constructor(code: string) {
        super(code, functionHashes, eventHashes);
    }
}
