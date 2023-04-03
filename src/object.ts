/**
 *
 * @param entries
 * @returns
 */
export const fromEntries = <K extends string, V>(entries: [K, V][]) =>
    Object.fromEntries(entries) as { [k in K]: V };

/**
 *
 * @param o
 * @returns
 */
export const entries = <K extends string, V>(o: { [k in K]: V }) => Object.entries(o) as [K, V][];

/**
 *
 * @param o
 * @param fn
 * @returns
 */
export const mapValues = <K extends string, V, W>(o: { [k in K]: V }, fn: (v: V) => W) =>
    fromEntries(entries(o).map(([name, value]) => [name, fn(value)]));
