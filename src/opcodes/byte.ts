import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class BYTE {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;
    readonly position: any;
    readonly data: any;

    constructor(position: any, data: any) {
        this.name = 'BYTE';
        this.wrapped = true;
        this.position = position;
        this.data = data;
    }

    toString() {
        return '(' + stringify(this.data) + ' >> ' + stringify(this.position) + ') & 1';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const position = stack.pop();
    const data = stack.pop();
    if (typeof data === 'bigint' && typeof position === 'bigint') {
        stack.push((data >> position) & 1n);
    } else {
        stack.push(new BYTE(position, data));
    }
};
