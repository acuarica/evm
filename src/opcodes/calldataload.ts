import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class CALLDATALOAD {
    readonly name = 'CALLDATALOAD';
    readonly type?: string;
    readonly returntype?: string;
    readonly wrapped = false;

    constructor(readonly location: any) {}

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
    const location = stack.pop();
    stack.push(new CALLDATALOAD(location));
};
