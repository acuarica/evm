import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CALLDATALOAD {
    readonly name: string;
    readonly type?: string;
    readonly returntype?: string;
    readonly wrapped: boolean;
    readonly location: any;

    constructor(location: any) {
        this.name = 'CALLDATALOAD';
        this.wrapped = false;
        this.location = location;
    }

    toString() {
        if (typeof this.location === 'bigint' && this.location === 0n) {
            return 'msg.data';
        } else if (typeof this.location === 'bigint' && (this.location - 4n) % 32n === 0n) {
            return '_arg' + ((this.location - 4n) / 32n).toString();
        } else {
            return 'msg.data[' + stringify(this.location) + ']';
        }
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    const startLocation = stack.pop();
    stack.push(new CALLDATALOAD(startLocation));
};
