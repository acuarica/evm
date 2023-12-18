type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/object.fromentries/index.d.ts
 */
declare global {
    interface ObjectConstructor {
        keys<K extends string>(o: { [k in K]: unknown }): K[];

        entries<T extends { [k in keyof T? extends string ? k : never]: T[k] }>(
            o: T
        ): [keyof T, T[keyof T]][];

        fromEntries<K, V>(entries: Iterable<readonly [K, V]>): { [k in K]: V };

        setPrototypeOf<T>(o: unknown, proto: T): T;

        assign<T, U extends unknown[]>(_target: T, ..._sources: U): T & UnionToIntersection<U[number]>;
    }
}

export { };
