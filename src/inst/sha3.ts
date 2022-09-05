import { Expr, isBigInt, MLoad, Sha3 } from '../ast';
import { Opcode } from '../opcode';
import { State } from '../state';

export function memArgs<T>(
    { stack, memory }: State,
    Klass: new (args: Expr[], memoryStart?: Expr, memoryLength?: Expr) => T
): T {
    const MAXSIZE = 1024;

    const offset = stack.pop();
    const size = stack.pop();
    if (isBigInt(offset) && isBigInt(size) && size <= MAXSIZE * 32) {
        const args = [];
        for (let i = Number(offset); i < Number(offset + size); i += 32) {
            args.push(i in memory ? memory[i] : new MLoad(BigInt(i)));
        }
        return new Klass(args);
    } else {
        if (isBigInt(size) && size > MAXSIZE * 32) {
            throw new Error(`memargs size${Klass.toString()}${size}`);
        }

        return new Klass([], offset, size);
    }
}
export const SHA3 = {
    SHA3: (_opcode: Opcode, state: State) => {
        // const memoryStart = stack.pop();
        // const memoryLength = stack.pop();
        state.stack.push(memArgs(state, Sha3));
        // if (isVal(memoryStart === 'bigint' && typeof memoryLength) && memoryLength <= 1024 * 32) {
        //     const items = [];
        //     for (let i = Number(memoryStart); i < Number(memoryStart + memoryLength); i += 32) {
        //         items.push(i in memory ? memory[i] : new MLOAD(i));
        //     }
        //     stack.push(new Sha3(items));
        // } else {
        //     stack.push(new Sha3([], memoryStart, memoryLength));
        // }
    },
};
