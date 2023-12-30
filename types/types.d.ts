
/**
 * 
 */
type Size<N extends number> = SizeN<N, [1]>[number];

/**
 *
 */
type SizeN<N extends number, T extends number[]> = T['length'] extends N
    ? T
    : SizeN<N, [AsNumber<Plus<T[0], T[-1]>>, ...T]>;

/**
 *
 */
type AsNumber<T> = T extends number ? T : never;

/**
 *
 */
type Plus<A extends number, B extends number> = Len<[...Tuple<A>, ...Tuple<B>]>;

/**
 * https://github.com/microsoft/TypeScript/pull/45711
 *
 * https://itnext.io/implementing-arithmetic-within-typescripts-type-system-a1ef140a6f6f
 */
type Len<T extends readonly unknown[]> = T extends { length: infer L } ? L : never;

type Tuple<L extends number, T extends readonly unknown[] = []> = T extends { length: L }
    ? T
    : Tuple<L, [...T, unknown]>;
