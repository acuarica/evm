/**
 * Determine whether the given `type` is a valid elementary Solidity type.
 *
 * @see {@link Type} definition for more info on `Type`.
 *
 * @param type value to check if it is a valid elementary type.
 * @returns
 */
export function isElemType(type: string): type is Type {
    return (ELEM_TYPES as readonly string[]).includes(type);
}

/**
 *
 */
const BITS = [...Array(32).keys()].map(n => (n + 1) * 8) as SizeN<32, [8]>;

/**
 *
 */
const BYTES = [...Array(32).keys()].map(n => n + 1) as SizeN<32, [1]>;

/**
 *
 */
const ELEM_TYPES = [
    'address',
    'address payable',
    'bool',
    'uint',
    ...BITS.map(n => `uint${n}` as const),
    'int',
    ...BITS.map(n => `int${n}` as const),
    'bytes',
    ...BYTES.map(n => `bytes${n}` as const),
    'string',
    'function',
] as const;

/**
 * The following elementary types exist[1]:
 *
 * - `uint<M>`: unsigned integer type of M bits, 0 < M <= 256, M % 8 == 0. e.g. uint32, uint8, uint256.
 * - `int<M>: two’s complement signed integer type of M bits, 0 < M <= 256, M % 8 == 0.
 * - `address`: equivalent to uint160, except for the assumed interpretation and language typing. For computing the function selector, address is used.
 * - `uint`, `int`: synonyms for uint256, int256 respectively. For computing the function selector, uint256 and int256 have to be used.
 * - `bool`: equivalent to uint8 restricted to the values 0 and 1. For computing the function selector, bool is used.
 * - `fixed<M>x<N>`: signed fixed-point decimal number of M bits, 8 <= M <= 256, M % 8 == 0, and 0 < N <= 80, which denotes the value v as v / (10 ** N).
 * - `ufixed<M>x<N>`: unsigned variant of fixed<M>x<N>.
 * - `fixed`, `ufixed`: synonyms for fixed128x18, ufixed128x18 respectively. For computing the function selector, fixed128x18 and ufixed128x18 have to be used.
 * - `bytes<M>`: binary type of M bytes, 0 < M <= 32.
 * - `function`: an address (20 bytes) followed by a function selector (4 bytes). Encoded identical to bytes24.
 *
 * See also [2] for more information on Types.
 *
 * - [1] https://docs.soliditylang.org/en/v0.8.19/abi-spec.html#types
 * - [2] https://docs.soliditylang.org/en/v0.8.19/types.html
 */
export type Type = (typeof ELEM_TYPES)[number];

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
