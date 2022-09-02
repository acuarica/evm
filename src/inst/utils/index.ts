import { Operand, State } from '../../state';
import { MLOAD } from '../memory';

export type Expr =
    | bigint
    | {
          wrapped: boolean;
      };

export function memArgs<T extends Operand>(
    { stack, memory }: State,
    Klass: new (args: Operand[], memoryStart?: Operand, memoryLength?: Operand) => T
): T {
    const MAXSIZE = 1024;

    const offset = stack.pop();
    const size = stack.pop();
    if (typeof offset === 'bigint' && typeof size === 'bigint' && size <= MAXSIZE * 32) {
        const args = [];
        for (let i = Number(offset); i < Number(offset + size); i += 32) {
            args.push(i in memory ? memory[i] : new MLOAD(i));
        }
        return new Klass(args);
    } else {
        if (typeof size === 'bigint' && size > MAXSIZE * 32) {
            // throw new Error('memargs size'+ Klass+ size);
        }

        return new Klass([], offset, size);
    }
}

export function isBigInt<T>(value: bigint | T): value is bigint {
    return typeof value === 'bigint';
}

export function stringify(value: Expr): string {
    return typeof value === 'bigint'
        ? value.toString(16)
        : !value.wrapped
        ? value.toString()
        : `(${value.toString()})`;
}
