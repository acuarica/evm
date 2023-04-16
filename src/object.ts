/**
 *
 * @param o
 * @param fn
 * @returns
 */
export const mapValues = <K extends string, V, W>(o: { [k in K]: V }, fn: (v: V) => W) =>
    Object.fromEntries(Object.entries(o).map(([name, value]) => [name, fn(value)]));

/**
 *
 * @param o
 * @param fn
 * @returns
 */
export const mapKeys = <K extends string, U>(o: { [k in K]: unknown }, fn: (k: K) => U) =>
    Object.fromEntries(Object.keys(o).map(k => [k, fn(k)]));
