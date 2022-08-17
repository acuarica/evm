import { Operand } from '../evm';
import stringify from '../utils/stringify';

export class Not {
    readonly name = 'NOT';
    readonly wrapped = true;

    constructor(readonly value: Operand) {}

    toString = () => `~${stringify(this.value)}`;
}
