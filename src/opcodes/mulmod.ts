import { EVM } from '../evm';
import { Opcode } from '../opcode';
import { MUL } from './mul';
import { MOD } from './mod';

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    const mod = state.stack.pop();
    if (typeof left === 'bigint' && typeof right === 'bigint' && typeof mod === 'bigint') {
        state.stack.push((left * right) % mod);
    } else if (typeof left === 'bigint' && typeof right === 'bigint') {
        state.stack.push(new MOD(left * right, mod));
    } else {
        state.stack.push(new MOD(new MUL(left, right), mod));
    }
};
