export function hex2a(hexx: any) {
    const hex = hexx.toString();
    let str = '';
    for (let i = 0; i < hex.length && hex.substr(i, 2) !== '00'; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

/**
 *
 * @param buffer
 * @returns
 */
export function toHex(buffer: Uint8Array): string {
    return buffer.reduce((str, elem) => str + elem.toString(16).padStart(2, '0'), '');
}
