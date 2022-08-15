import { EVM } from '../evm';
import { Opcode } from '../opcode';

export class DIFFICULTY {
    readonly name: string;
    readonly type?: string;
    readonly wrapped: boolean;

    constructor() {
        this.name = 'DIFFICULTY';
        this.wrapped = false;
    }

    toString() {
        return 'block.difficulty';
    }
}

export default (_opcode: Opcode, state: EVM): void => {
    state.stack.push(new DIFFICULTY());
};
