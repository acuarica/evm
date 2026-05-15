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

    /**
     * > _The constructor of a mixin class (if any) must have a single rest parameter of type `any[]` and
     * > must use the spread operator to pass those parameters as arguments in a `super(...args)` call._
     * 
     * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-mix-in-classes
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Cons<T extends object> = new (...args: any[]) => T;
}

export { };