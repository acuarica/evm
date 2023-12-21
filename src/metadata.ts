import { fromHexString } from './step';

const BZZR0 = '627a7a7230';
const BZZR1 = '627a7a7231';
const IPFS = '69706673';

const SOLC = '736f6c63';

const protocols: [RegExp, 'bzzr' | 'ipfs'][] = [
    /**
     * https://docs.soliditylang.org/en/v0.5.8/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
     */
    [new RegExp(`a165${BZZR0}5820([a-f0-9]{64})0029$`), 'bzzr'],

    /**
     * https://docs.soliditylang.org/en/v0.5.9/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
     * https://blog.soliditylang.org/2019/05/28/solidity-0.5.9-release-announcement/
     */
    [new RegExp(`a265${BZZR1}5820([a-f0-9]{64})64${SOLC}43([a-f0-9]{6})0032$`), 'bzzr'],

    /**
     * v0.6.2 ends with `0x00 0x33` but v0.6.1 ends with `0x00 0x32`
     * https://blog.soliditylang.org/2019/12/17/solidity-0.6.0-release-announcement/
     * https://docs.soliditylang.org/en/v0.6.2/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
     */
    [new RegExp(`a264${IPFS}5822([a-f0-9]{68})64${SOLC}43([a-f0-9]{6})0033$`), 'ipfs'],
];

/**
 * Represents the metadata hash protocols embedded in bytecode by `solc`.
 */
export class Metadata {
    constructor(readonly protocol: 'bzzr' | 'ipfs', readonly hash: string, readonly solc: string) {}

    get url(): string {
        return `${this.protocol}://${this.hash}`;
    }

    get minor(): number | undefined {
        const field = /^0\.(\d+)\./.exec(this.solc)?.[1];
        return field ? parseInt(field) : undefined;
    }
}

/**
 * Splits the `bytecode` into executable code and embedded metadata hash as
 * placed by the Solidity compiler, if present in the `bytecode`.
 *
 * @param bytecode the contract `bytecode` to test for metadata hash from, hex encoded.
 * @returns An tuple where the first component is the executable code and
 * second one is the metadata hash when the metadata is present.
 * Otherwise, the original `bytecode` and `undefined` respectively.
 */
export function stripMetadataHash(bytecode: string): [string, Metadata | undefined] {
    for (const [re, protocol] of protocols) {
        const match = bytecode.match(re);
        if (match && match[1]) {
            return [
                bytecode.substring(0, match.index),
                new Metadata(
                    protocol,
                    protocol === 'ipfs' ? bs58(fromHexString(match[1])) : match[1],
                    match[2] ? convertVersion(match[2]) : '<0.5.9'
                ),
            ];
        }
    }

    return [bytecode, undefined];

    /**
     *
     * @param solcVersion
     * @returns
     */
    function convertVersion(solcVersion: string) {
        const slice = (pos: number) => parseInt(solcVersion.slice(pos, pos + 2), 16).toString();
        return `${slice(0)}.${slice(2)}.${slice(4)}`;
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
