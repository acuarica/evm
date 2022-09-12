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

export function assertiif(left: boolean, right: boolean, ...args: any[]) {
    assert((left && right) || (!left && !right), ...args);
}
