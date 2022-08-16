import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class BYTE {
    readonly name = 'BYTE';
    readonly type?: string;
    readonly wrapped = true;

    constructor(readonly position: any, readonly data: any) {}

    toString() {
        return '(' + stringify(this.data) + ' >> ' + stringify(this.position) + ') & 1';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const position = stack.pop();
    const data = stack.pop();
    stack.push(
        typeof data === 'bigint' && typeof position === 'bigint'
            ? (data >> position) & 1n
            : new BYTE(position, data)
    );
};
