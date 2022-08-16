import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class STATICCALL {
    readonly name = 'STATICCALL';
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly gas: any,
        readonly address: any,
        readonly memoryStart: any,
        readonly memoryLength: any,
        readonly outputStart: any,
        readonly outputLength: any
    ) {}

    toString() {
        return (
            'staticcall(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.memoryStart) +
            ',' +
            stringify(this.memoryLength) +
            ',' +
            stringify(this.outputStart) +
            ',' +
            stringify(this.outputLength) +
            ')'
        );
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const gas = stack.pop();
    const address = stack.pop();
    const memoryStart = stack.pop();
    const memoryLength = stack.pop();
    const outputStart = stack.pop();
    const outputLength = stack.pop();
    stack.push(new STATICCALL(gas, address, memoryStart, memoryLength, outputStart, outputLength));
};
