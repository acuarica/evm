import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import { ADD } from './add';
import { MOD } from './mod';

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    const mod = state.stack.pop();
    state.stack.push(
        typeof left === 'bigint' && typeof right === 'bigint' && typeof mod === 'bigint'
            ? (left + right) % mod
            : typeof left === 'bigint' && typeof right === 'bigint'
            ? new MOD(left + right, mod)
            : new MOD(new ADD(left, right), mod)
    );
};
