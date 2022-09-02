import { Operand, State } from '../../state';
import { MLOAD } from '../memory';

const MAXSIZE = 1024;

export function memArgs<T extends Operand>(
    { stack, memory }: State,
    Klass: new (items: Operand[], memoryStart?: Operand, memoryLength?: Operand) => T,
    push: (value: T) => void
) {
    const offset = stack.pop();
    const size = stack.pop();
    if (typeof offset === 'bigint' && typeof size === 'bigint' && size <= MAXSIZE * 32) {
        const items = [];
        for (let i = Number(offset); i < Number(offset + size); i += 32) {
            items.push(i in memory ? memory[i] : new MLOAD(i));
        }
        push(new Klass(items));
    } else {
        if (typeof size === 'bigint' && size > MAXSIZE * 32) {
            // throw new Error('memargs size'+ Klass+ size);
        }

        stack.push(new Klass([], offset, size));
    }
}

export function isBigInt<T>(value: bigint | T): value is bigint {
    return typeof value === 'bigint';
}

export function stringify(value: bigint | { wrapped: boolean }): string {
    return typeof value === 'bigint'
        ? value.toString(16)
        : !value.wrapped
        ? value.toString()
        : `(${value.toString()})`;
}
