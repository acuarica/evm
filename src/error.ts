import { inspect } from 'util';

const DEBUG = process.env['DEBUG'];

/**
 *
 * @param condition
 */
export function assert(condition: boolean, ...args: any[]): asserts condition {
    if (DEBUG && !condition) {
        throw Error(`Assert failed: ${args.map(arg => inspect(arg, true, 6)).join(', ')}`);
    }
}

export function assertiif(left: boolean, right: boolean, ...args: any[]) {
    assert((left && right) || (!left && !right), ...args);
}
