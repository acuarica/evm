
/**
 * Represents an `Error` that occurs during decoding.
 * 
 * position The position in the bytecode where the error occurred.
 * @param data the hexadecimal string to convert to `Uint8Array`
 * @returns the `Uint8Array` representation of `hexstr`
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
        const value = parseInt(byte, 16);
        if (value >= 0) {
            buffer[j] = value;
        } else {
            throw new Error(`Unable to decode, invalid hex byte '${byte}' found at position '${i + 1}'`);
        }
    }
    return buffer;
}

export function hexlify(data: Uint8Array): string {
    return data.reduce((str, elem) => str + elem.toString(16).padStart(2, '0'), '');
}