import { EVM } from '../../src/classes/evm.class';
import * as functionHashes from '../../data/functionHashes.json';
import * as eventHashes from '../../data/eventHashes.json';

export default class extends EVM {
    constructor(code: string | Buffer) {
        super(code, functionHashes as any, eventHashes as any);
    }
}
