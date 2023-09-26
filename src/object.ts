/**
 *
 * @param o
 * @param fn
 * @returns
 */
export const mapValues = <K extends string, V, W>(o: { [k in K]: V }, fn: (v: V) => W) =>
    Object.fromEntries(Object.entries(o).map(([name, value]) => [name, fn(value)]));
