
/**
 * Shorthand for `Object.entries`.
 */
export const entries = Object.entries;

/**
 * Shorthand for `Object.fromEntries`.
 */
export const zip = Object.fromEntries;

/**
 * Transforms the given object `o` by appliying `fn` to all values,
 * leaving the same keys.
 * 
 * @example
 * 
 * ```
 * console.log(mapValues({ a: 1, b: 2 }, n => n * 2));
 * // { a: 2, b: 4 }
 * ```
 * 
 * @param o 
 * @param fn 
 * @returns 
 */
export const mapValues = <K extends string, R extends { [k in K]: R[k] }, U>(
    o: R,
    fn: (value: R[keyof R]) => U,
): { [k in keyof R]: U } => zip(entries(o).map(([k, v]) => [k, fn(v)]));

/**
 * It returns a sequence of numbers, starting from `0`, and increments by `1`,
 * and stops before `n`.
 * 
 * @example
 * 
 * ```
 * console.log(range(5));
 * // [ 0, 1, 2, 3, 4 ]
 * ```
 * 
 * @param n 
 * @returns An array in the range `[0, n)`
 */
export const range = (n: number): number[] => [...Array(n).keys()];