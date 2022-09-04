import { State } from '../../state';
import { MLoad } from '../memory';

export type Expr =
    | bigint
    | {
          wrapped: boolean;
      };

export function memArgs<T extends Expr>(
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

export function isBigInt(expr: Expr): expr is bigint {
    return typeof expr === 'bigint';
}

export function isZero(expr: Expr): expr is bigint {
    return isBigInt(expr) && expr === 0n;
}

export function stringify(value: Expr): string {
    return typeof value === 'bigint'
        ? value.toString(16)
        : !value.wrapped
        ? value.toString()
        : `(${value.toString()})`;
}
