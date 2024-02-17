import { arrayify, hexlify } from './.bytes';

/**
 * Represents the metadata hash protocols embedded in bytecode by `solc`.
 * 
 * See https://docs.soliditylang.org/en/latest/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode.
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
 * Splits `buffer` into the executable EVM bytecode and the embedded metadata hash.
 * The metadata hash may be placed by the 
 * [Solidity compiler](https://docs.soliditylang.org/en/latest/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode)
 * as a [compilation fingerprint](https://docs.sourcify.dev/blog/talk-about-onchain-metadata-hash/#introduction).
 * It may include the 
 * [compiler version](https://blog.soliditylang.org/2019/05/28/solidity-0.5.9-release-announcement/)
 * and the hash of the compilation input, _i.e._ the source code and compilation settings.
 * 
 * The bytecode might have been compiled with no metadata or with a different language that does not include metadata.
 * In this case the `metadata` property is `undefined` and the `bytecode` property is the original `buffer`.
 *
 * The metadata hash is placed at the end of the EVM bytecode and encoded using [CBOR](https://cbor.io/).
 * We use [`cbor-js`](https://github.com/paroga/cbor-js) to decode the metadata hash.
 * If `metadata` contains an IPFS hash, it is encoded using base 58.
 * We use [`base58-js`](https://github.com/pur3miish/base58-js) to encode the IPFS hash.
 * If metadata contains a Swarm hash, _i.e._ `bzzr0` or `bzzr1`, it is encoded using hexadecimal.
 * 
 * @param buffer the contract or library bytecode to test for metadata hash.
 * @returns An object where the `bytecode` is the executable code and
 * `metadata` is the metadata hash when the metadata is present.
 */
export function splitMetadataHash(buffer: Parameters<typeof arrayify>[0]): {
    /**
     * The executable code without metadata when it is present.
     * Otherwise, the original `bytecode`.
     */
    bytecode: Uint8Array,

    /**
     * The metadata if present. Otherwise `undefined`.
     * 
     * See https://docs.soliditylang.org/en/latest/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode.
     */
    metadata: Metadata | undefined
} {
    const bytecode = arrayify(buffer);
    if (bytecode.length <= 2) return { bytecode, metadata: undefined };

    const dataLen = (bytecode.at(-2)! << 8) + bytecode.at(-1)!;
    const data = new Uint8Array(bytecode.subarray(bytecode.length - 2 - dataLen, bytecode.length - 2));
    if (data.length !== dataLen) return { bytecode, metadata: undefined };

    try {
        const obj = cbor(data.buffer);
        if (obj === null || typeof obj !== 'object') return { bytecode, metadata: undefined };

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
 * **Implementation from https://github.com/pur3miish/base58-js**
 * 
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

/**
 * 
 */
type CBORItem = number | boolean | Uint8Array | string | null | undefined | CBORItem[] | { [key: string]: CBORItem };

/**
 * **Implementation from https://github.com/paroga/cbor-js**
 * 
 * Embedded it here to avoid including the encoder.
 */
function cbor(data: ArrayBufferLike): CBORItem {
    const POW_2_24 = Math.pow(2, -24), POW_2_32 = Math.pow(2, 32);

    const dataView = new DataView(data);
    let offset = 0;

    function read<T>(value: T, length: number) {
        offset += length;
        return value;
    }
    function readArrayBuffer(length: number) {
        return read(new Uint8Array(data, offset, length), length);
    }
    function readFloat16() {
        const tempArrayBuffer = new ArrayBuffer(4);
        const tempDataView = new DataView(tempArrayBuffer);
        const value = readUint16();

        const sign = value & 0x8000;
        let exponent = value & 0x7c00;
        const fraction = value & 0x03ff;

        if (exponent === 0x7c00)
            exponent = 0xff << 10;
        else if (exponent !== 0)
            exponent += (127 - 15) << 10;
        else if (fraction !== 0)
            return fraction * POW_2_24;

        tempDataView.setUint32(0, sign << 16 | exponent << 13 | fraction << 13);
        return tempDataView.getFloat32(0);
    }
    const readFloat32 = () => read(dataView.getFloat32(offset), 4);
    const readFloat64 = () => read(dataView.getFloat64(offset), 8);
    const readUint8 = () => read(dataView.getUint8(offset), 1);
    const readUint16 = () => read(dataView.getUint16(offset), 2);
    const readUint32 = () => read(dataView.getUint32(offset), 4);
    const readUint64 = () => readUint32() * POW_2_32 + readUint32();
    function readBreak() {
        if (dataView.getUint8(offset) !== 0xff)
            return false;
        offset += 1;
        return true;
    }
    function readLength(additionalInformation: number) {
        if (additionalInformation < 24) return additionalInformation;
        if (additionalInformation === 24) return readUint8();
        if (additionalInformation === 25) return readUint16();
        if (additionalInformation === 26) return readUint32();
        if (additionalInformation === 27) return readUint64();
        if (additionalInformation === 31) return -1;
        throw "Invalid length encoding";
    }
    function readIndefiniteStringLength(majorType: number) {
        const initialByte = readUint8();
        if (initialByte === 0xff)
            return -1;
        const length = readLength(initialByte & 0x1f);
        if (length < 0 || (initialByte >> 5) !== majorType)
            throw "Invalid indefinite length element";
        return length;
    }

    function appendUtf16data(utf16data: number[], length: number) {
        for (let i = 0; i < length; ++i) {
            let value = readUint8();
            if (value & 0x80) {
                if (value < 0xe0) {
                    value = (value & 0x1f) << 6
                        | (readUint8() & 0x3f);
                    length -= 1;
                } else if (value < 0xf0) {
                    value = (value & 0x0f) << 12
                        | (readUint8() & 0x3f) << 6
                        | (readUint8() & 0x3f);
                    length -= 2;
                } else {
                    value = (value & 0x0f) << 18
                        | (readUint8() & 0x3f) << 12
                        | (readUint8() & 0x3f) << 6
                        | (readUint8() & 0x3f);
                    length -= 3;
                }
            }

            if (value < 0x10000) {
                utf16data.push(value);
            } else {
                value -= 0x10000;
                utf16data.push(0xd800 | (value >> 10));
                utf16data.push(0xdc00 | (value & 0x3ff));
            }
        }
    }

    function decodeItem(): CBORItem {
        const initialByte = readUint8();
        const majorType = initialByte >> 5;
        const additionalInformation = initialByte & 0x1f;
        let i;
        let length;

        if (majorType === 7) {
            switch (additionalInformation) {
                case 25: return readFloat16();
                case 26: return readFloat32();
                case 27: return readFloat64();
            }
        }

        length = readLength(additionalInformation);
        if (length < 0 && (majorType < 2 || 6 < majorType)) throw "Invalid length";

        switch (majorType) {
            case 0:
                return length;
            case 1:
                return -1 - length;
            case 2:
                if (length < 0) {
                    const elements = [];
                    let fullArrayLength = 0;
                    while ((length = readIndefiniteStringLength(majorType)) >= 0) {
                        fullArrayLength += length;
                        elements.push(readArrayBuffer(length));
                    }
                    const fullArray = new Uint8Array(fullArrayLength);
                    let fullArrayOffset = 0;
                    for (i = 0; i < elements.length; ++i) {
                        fullArray.set(elements[i], fullArrayOffset);
                        fullArrayOffset += elements[i].length;
                    }
                    return fullArray;
                }
                return readArrayBuffer(length);
            case 3:
                const utf16data: number[] = [];
                if (length < 0) {
                    while ((length = readIndefiniteStringLength(majorType)) >= 0)
                        appendUtf16data(utf16data, length);
                } else
                    appendUtf16data(utf16data, length);
                return String.fromCharCode.apply(null, utf16data);
            case 4:
                let retArray: CBORItem[];
                if (length < 0) {
                    retArray = [];
                    while (!readBreak())
                        retArray.push(decodeItem());
                } else {
                    retArray = new Array(length) as CBORItem[];
                    for (i = 0; i < length; ++i)
                        retArray[i] = decodeItem();
                }
                return retArray;
            case 5:
                const retObject: Record<string, CBORItem> = {};
                for (i = 0; i < length || length < 0 && !readBreak(); ++i) {
                    const key = decodeItem() as string;
                    retObject[key] = decodeItem();
                }
                return retObject;
            case 6:
                return decodeItem();
            case 7:
                switch (length) {
                    case 20:
                        return false;
                    case 21:
                        return true;
                    case 22:
                        return null;
                    case 23:
                        return undefined;
                    default:
                        return undefined;
                }
            default: throw new Error('Unrecognized major type');
        }
    }

    const item = decodeItem();
    if (offset !== data.byteLength) throw "Remaining bytes";
    return item;
}
