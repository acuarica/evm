import { EVM } from '../evm';
import { Opcode } from '../opcode';
import stringify from '../utils/stringify';

export class JUMP {
    readonly name = 'JUMP';
    readonly type?: string;
    readonly wrapped: boolean = false;
    readonly valid: boolean;

    constructor(readonly location: any, bad?: boolean) {
        this.valid = !bad;
    }

    toString() {
        return this.valid
            ? 'goto(' + stringify(this.location) + ');'
            : 'revert("Bad jump destination");';
    }
}

export default (opcode: Opcode, state: EVM): void => {
    const jumpLocation = state.stack.pop();
    if (typeof jumpLocation !== 'bigint') {
        state.halted = true;
        state.instructions.push(new JUMP(jumpLocation, true));
    } else {
        const opcodes = state.getOpcodes();
        const jumpLocationData = opcodes.find(op => op.pc === Number(jumpLocation));
        if (!jumpLocationData) {
            state.halted = true;
            state.instructions.push(new JUMP(jumpLocation, true));
        } else {
            const jumpIndex = opcodes.indexOf(jumpLocationData);
            if (!(opcode.pc + ':' + Number(jumpLocation) in state.jumps)) {
                if (!jumpLocationData || jumpLocationData.name !== 'JUMPDEST') {
                    state.halted = true;
                    state.instructions.push(new JUMP(jumpLocation, true));
                } else if (
                    jumpLocationData &&
                    jumpIndex >= 0 &&
                    jumpLocationData.name === 'JUMPDEST'
                ) {
                    state.jumps[opcode.pc + ':' + Number(jumpLocation)] = true;
                    state.pc = jumpIndex;
                } else {
                    state.halted = true;
                    state.instructions.push(new JUMP(jumpLocation, true));
                }
            } else {
                state.halted = true;
                state.instructions.push(new JUMP(jumpLocation));
            }
        }
    }
};
