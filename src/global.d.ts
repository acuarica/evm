/**
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/object.fromentries/index.d.ts
 */
export declare global {
    interface ObjectConstructor {
        keys<K extends string>(o: { [k in K]: unknown }): K[];

        entries<K extends string, V>(o: { [k in K]: V }): [K, V][];

        fromEntries<K extends string, V>(entries: Iterable<readonly [K, V]>): { [k in K]: V };
    }
}
