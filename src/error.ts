import { inspect } from 'util';

/**
 *
 * @param condition
 */
export function assert(condition: boolean, ...args: any[]): asserts condition {
    if (!condition) {
        throw Error(`Assert failed: ${args.map(arg => inspect(arg, true, 6)).join(', ')}`);
    }
}

export function check(condition: boolean, message: string) {
    if (!condition) {
        throw new Error('check' + message);
    }
}
