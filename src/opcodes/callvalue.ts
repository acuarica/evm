import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class CALLVALUE {
    readonly name = 'CALLVALUE';
    readonly type?: string;
    readonly wrapped: boolean = false;

    toString() {
        return 'msg.value';
    }
}

export default (_opcode: Opcode, { stack }: EVM): void => {
    stack.push(new CALLVALUE());
};
