import { EVM } from '../classes/evm.class';
import { Opcode } from '../opcode.interface';
import { SHL } from './shl';
import { SAR } from './sar';
import { SUB } from './sub';

export default (_opcode: Opcode, state: EVM): void => {
    const left = state.stack.pop();
    const right = state.stack.pop();
    if (typeof left === 'bigint' && typeof right === 'bigint') {
        state.stack.push((right << (32n - left)) >> (32n - left));
    } else if (typeof left === 'bigint') {
        state.stack.push(new SAR(new SHL(right, 32n - left), 32n - left));
    } else {
        state.stack.push(new SAR(new SHL(right, new SUB(32n, left)), new SUB(32n, left)));
    }
};
