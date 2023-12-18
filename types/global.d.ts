/**
 * Converts a union to an intersection type.
 * 
 * It works by distributing the union's type[^1] and reconstrucing it
 * by intersection the result parameter. 
 * 
 * [^1]: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 */
type UnionToIntersection<U> = (U extends unknown ? (_: U) => void : never) extends (_: infer I) => void ? I : never;

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

        setPrototypeOf<T>(o: unknown, proto: T): T;

        assign<T, U extends unknown[]>(target: T, ...sources: U): T & UnionToIntersection<U[number]>;
    }
}

export { };
