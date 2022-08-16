import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CALLCODE {
    readonly name = 'CALLCODE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(
        readonly gas: any,
        readonly address: any,
        readonly value: any,
        readonly memoryStart: any,
        readonly memoryLength: any,
        readonly outputStart: any,
        readonly outputLength: any
    ) {}

    toString() {
        return (
            'callcode(' +
            stringify(this.gas) +
            ',' +
            stringify(this.address) +
            ',' +
            stringify(this.value) +
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
    const value = stack.pop();
    const memoryStart = stack.pop();
    const memoryLength = stack.pop();
    const outputStart = stack.pop();
    const outputLength = stack.pop();

    stack.push(
        new CALLCODE(gas, address, value, memoryStart, memoryLength, outputStart, outputLength)
    );
};
