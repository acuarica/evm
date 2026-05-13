
export const entries = Object.entries;

export const zip = Object.fromEntries;

export function mapValues<K extends string, R extends { [k in K]: R[k] }, U>(
    o: R,
    fn: (value: R[keyof R]) => U,
): { [k in keyof R]: U } {
    return zip(entries(o).map(([k, v]) => [k, fn(v)]));
}

export const range = (n: number): number[] => [...Array(n).keys()];