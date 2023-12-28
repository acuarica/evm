/**
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/object.fromentries/index.d.ts
 */
declare global {
    interface ObjectConstructor {
        keys<K extends string>(o: { [k in K]: unknown }): K[];

        entries<K extends keyof T & string, T extends { [k in K]: T[k] }>(
            o: T
        ): [keyof T, T[keyof T]][];

        fromEntries<K, V>(entries: Iterable<readonly [K, V]>): { [k in K]: V };
    }
}

export { };
