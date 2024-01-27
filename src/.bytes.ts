
/**
 * Converts `data` into a suitable `Uint8Array` representation.
 * When `data` is a `string`, it must be a hexadecimal string.
 * The hexadecimal string may optionally start with `0x`.
 * 
 * When `data` is an `ArrayLike<number>`, it is converted to a `Uint8Array`.
 * If `data` is a `Uint8Array`, it is returned as-is.
 * 
 * If `data` is a `string` and it is not a valid hexadecimal string,
 * it throws an `Error`.
 * 
 * @param data the data to convert to `Uint8Array`
 * @returns the `Uint8Array` representation of `data`
 */
export function arrayify(data: Uint8Array | ArrayLike<number> | string): Uint8Array {
    if (data instanceof Uint8Array) return data;
    if (typeof data !== 'string') return new Uint8Array(data);

    if (data.length % 2 !== 0) {
        throw new Error(`Unable to decode, input should have even length, but got length '${data.length}'`);
    }

    const start = data.slice(0, 2).toLowerCase() === '0x' ? 2 : 0;
    const buffer = new Uint8Array((data.length - start) / 2);
    for (let i = start, j = 0; i < data.length; i += 2, j++) {
        const byte = data.slice(i, i + 2);
        const value = Number('0x' + byte);
        if (value >= 0) {
            buffer[j] = value;
        } else {
            throw new Error(`Unable to decode, invalid hex byte '${byte}' found at position '${i + 1}'`);
        }
    }
    return buffer;
}

/**
 * Converts `data` into a hexadecimal string without the `0x` prefix.
 * 
 * @param data the `Uint8Array` to convert to a hexadecimal string
 * @returns the hexadecimal string representation of `data`
 */
export function hexlify(data: Uint8Array): string {
    return data.reduce((str, elem) => str + elem.toString(16).padStart(2, '0'), '');
}
