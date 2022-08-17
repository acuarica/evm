import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CALL {
    readonly name = 'CALL';
    readonly type?: string;
    readonly wrapped = false;
    throwOnFail = false;

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
        if (
            typeof this.memoryLength === 'bigint' &&
            this.memoryLength === 0n &&
            typeof this.outputLength === 'bigint' &&
            this.outputLength === 0n
        ) {
            if (
                this.gas.name === 'MUL' &&
                this.gas.left.name === 'ISZERO' &&
                typeof this.gas.right === 'bigint' &&
                this.gas.right === 2300n
            ) {
                if (this.throwOnFail) {
                    return (
                        'address(' +
                        stringify(this.address) +
                        ').transfer(' +
                        stringify(this.value) +
                        ')'
                    );
                } else {
                    return (
                        'address(' +
                        stringify(this.address) +
                        ').send(' +
                        stringify(this.value) +
                        ')'
                    );
                }
            } else {
                return (
                    'address(' +
                    stringify(this.address) +
                    ').call.gas(' +
                    stringify(this.gas) +
                    ').value(' +
                    stringify(this.value) +
                    ')'
                );
            }
        } else {
            return (
                'call(' +
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
}

export class ReturnData {
    readonly name = 'ReturnData';
    readonly wrapped = false;

    constructor(readonly retOffset: any, readonly retSize: any) {}

    toString() {
        return `output:ReturnData:${this.retOffset}:${this.retSize}`;
    }
}

export default (_opcode: Opcode, { stack, memory }: EVM): void => {
    const gas = stack.pop();
    const address = stack.pop();
    const value = stack.pop();
    const memoryStart = stack.pop();
    const memoryLength = stack.pop();
    const outputStart = stack.pop();
    const outputLength = stack.pop();
    stack.push(new CALL(gas, address, value, memoryStart, memoryLength, outputStart, outputLength));

    // if (typeof outputStart !== 'number') {
    //     console.log('WARN:CALL outstart should be number');
    // }

    memory[outputStart as any as number] = new ReturnData(outputStart, outputLength);
};
