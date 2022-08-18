import { Operand } from '../evm';
import stringify from '../utils/stringify';

export class BlockHash {
    readonly name = 'BLOCKHASH';
    readonly wrapped = true;

    constructor(readonly blockNumber: Operand) {}

    toString = () => `block.blockhash(${stringify(this.blockNumber)})`;
}
