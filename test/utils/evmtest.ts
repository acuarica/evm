import { EVM } from '../../src';
import * as functionHashes from '../../data/functionHashes.json';
import * as eventHashes from '../../data/eventHashes.json';

export default class extends EVM {
    constructor(code: string) {
        super(code, functionHashes, eventHashes);
    }
}
