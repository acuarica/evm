import CBOR from 'cbor-js';
import { arrayify, hexlify } from './.bytes';

/**
 * https://docs.soliditylang.org/en/v0.5.8/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 * 
 * https://docs.soliditylang.org/en/v0.5.9/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 * https://blog.soliditylang.org/2019/05/28/solidity-0.5.9-release-announcement/
 * 
 * v0.6.2 ends with `0x00 0x33` but v0.6.1 ends with `0x00 0x32`
 * https://blog.soliditylang.org/2019/12/17/solidity-0.6.0-release-announcement/
 * https://docs.soliditylang.org/en/v0.6.2/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 */

/**
 * Represents the metadata hash protocols embedded in bytecode by `solc`.
 */
export class Metadata {
    [key: string]: string | Uint8Array | undefined | boolean | number;
    protocol: 'bzzr0' | 'bzzr1' | 'ipfs' | '' = '';
    hash = '';
    solc = '';
    experimental?: boolean;

    get url(): string {
        return `${this.protocol}://${this.hash}`;
    }

    get minor(): number | undefined {
        const field = /^0\.(\d+)\./.exec(this.solc)?.[1];
        return field ? parseInt(field) : undefined;
    }
}

/**
 * Splits the `buffer` into executable bytecode and the embedded metadata hash
 * placed by the Solidity compiler if present in the `bytecode`.
 *
 * If `metadata` contains an IPFS hash, it is encoded using base 58.[^1]
 * 
 * @param buffer the contract or library `bytecode` to test for metadata hash.
 * @returns An object where the `bytecode` is the executable code and
 * `metadata` is the metadata hash when the metadata is present.
 * 
 * [^1]: https://github.com/pur3miish/base58-js
 */
export function splitMetadataHash(buffer: Parameters<typeof arrayify>[0]): {
    /**
     * The executable code without metadata when it is present.
     * Otherwise, the original `bytecode`.
     */
    bytecode: Uint8Array,

    /**
     * The metadata if present. Otherwise `undefined`.
     */
    metadata: Metadata | undefined
} {
    const bytecode = arrayify(buffer);
    if (bytecode.length <= 2) return { bytecode, metadata: undefined };

    const dataLen = (bytecode.at(-2)! << 8) + bytecode.at(-1)!;
    const data = new Uint8Array(bytecode.subarray(bytecode.length - 2 - dataLen, bytecode.length - 2));
    if (data.length !== dataLen) return { bytecode, metadata: undefined };

    try {
        const obj = CBOR.decode(data.buffer);
        const metadata = new Metadata();

        if ('ipfs' in obj && obj['ipfs'] instanceof Uint8Array) {
            metadata.protocol = 'ipfs';
            metadata.hash = bs58(obj['ipfs']);
            delete obj['ipfs'];
        } else if ('bzzr0' in obj && obj['bzzr0'] instanceof Uint8Array) {
            metadata.protocol = 'bzzr0';
            metadata.hash = hexlify(obj['bzzr0']);
            delete obj['bzzr0'];
        } else if ('bzzr1' in obj && obj['bzzr1'] instanceof Uint8Array) {
            metadata.protocol = 'bzzr1';
            metadata.hash = hexlify(obj['bzzr1']);
            delete obj['bzzr1'];
        }
        if ('solc' in obj && obj['solc'] instanceof Uint8Array) {
            metadata.solc = obj['solc'].join('.');
            delete obj['solc'];
        }

        return {
            bytecode: bytecode.subarray(0, bytecode.length - 2 - dataLen),
            metadata: Object.assign(metadata, obj)
        };
    } catch {
        return { bytecode, metadata: undefined };
    }
}

/**
 * Converts a Uint8Array into a base58 string.
 *
 * @param buffer Unsigned integer array to encode.
 * @returns base58 string representation of the binary array.
 * @example <caption>Usage.</caption>
 *
 * ```js
 * const str = bs58([15, 239, 64])
 * console.log(str)
 * ```
 *
 * Logged output will be 6MRy.
 */
function bs58(buffer: Uint8Array): string {
    /** Base58 characters include numbers `123456789`, uppercase `ABCDEFGHJKLMNPQRSTUVWXYZ` and lowercase `abcdefghijkmnopqrstuvwxyz` */
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    /** Mapping between base58 and ASCII */
    const base58Map = Array(256).fill(-1) as number[];
    for (let i = 0; i < chars.length; ++i) {
        base58Map[chars.charCodeAt(i)] = i;
    }

    const result = [];

    for (const byte of buffer) {
        let carry = byte;
        for (let j = 0; j < result.length; ++j) {
            const x: number = (base58Map[result[j]] << 8) + carry;
            result[j] = chars.charCodeAt(x % 58);
            carry = (x / 58) | 0;
        }
        while (carry) {
            result.push(chars.charCodeAt(carry % 58));
            carry = (carry / 58) | 0;
        }
    }

    for (const byte of buffer) {
        if (byte) break;
        else result.push('1'.charCodeAt(0));
    }

    result.reverse();

    return String.fromCharCode(...result);
}
