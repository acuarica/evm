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

declare global {
    /**
     * https://github.com/microsoft/TypeScript/pull/45711
     *
     * https://itnext.io/implementing-arithmetic-within-typescripts-type-system-a1ef140a6f6f
     */
    type Len<T extends readonly unknown[]> = T extends { length: infer L } ? L : never;

    type Tuple<L extends number, T extends readonly unknown[] = []> = T extends { length: L }
        ? T
        : Tuple<L, [...T, unknown]>;

    type Plus<A extends number, B extends number> = Len<[...Tuple<A>, ...Tuple<B>]>;

    type AsNumber<T> = T extends number ? T : never;
}
