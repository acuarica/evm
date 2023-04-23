import { readFileSync, writeFileSync } from 'fs';
import assert from 'assert';
import { utils } from 'ethers';

/**
 *
 * @param {string} f
 * @returns {string[]}
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const json = f => JSON.parse(readFileSync(`./selectors/${f}.json`, 'utf-8'));
const functions = json('functions');
const events = json('events');

/** @typedef {{ [hash: string]: string }} Hashes */

const BITS = [...Array(32).keys()].map(n => (n + 1) * 8);
const BYTES = [...Array(32).keys()].map(n => n + 1);
const TYPES = [
    'address payable',
    'address',
    'bool',
    ...BITS.map(n => `uint${n}`).reverse(),
    'uint',
    ...BITS.map(n => `int${n}`).reverse(),
    'int',
    ...BYTES.map(n => `bytes${n}`).reverse(),
    'bytes',
    'string',
    'function',
];
const TABLE = TYPES.map((t, i) => /** @type {const} */ ([t, String.fromCharCode(i + 33)]));

/**
 *
 * @param {string} entry
 */
function encodeTypes(entry) {
    for (const [t, c] of TABLE) {
        entry = entry.replaceAll(t, c);
    }
    return entry;
}

/**
 *
 * @param {string[]} entries
 * @param {(value: string) => string} replacer
 * @returns
 */
const reduce = (entries, replacer) =>
    entries.reduce((/** @type {Hashes}*/ map, /** @type {string}*/ entry) => {
        map[replacer(utils.keccak256(utils.toUtf8Bytes(entry)))] = entry;
        return map;
    }, {});

const functionHashes = reduce(functions, s => s.substring(2, 10));
const eventHashes = reduce(events, s => s.substring(2));

/**
 *
 * @param {string} filename
 * @param {Hashes} selectors
 */
function serialize(filename, selectors, SIZE) {
    // eslint-disable-next-line no-undef
    const te = new TextEncoder();
    const entries = [];
    for (const [selector, signature] of Object.entries(selectors)) {
        if (signature.length >= 256) continue;

        assert(selector.length === SIZE, selector);
        assert(signature.length < 256, signature);

        let offset = 0;
        const size = selector.length + 1;
        const entry = new ArrayBuffer(size);
        const view = new DataView(entry);
        view.setUint32(offset, parseInt(selector, 16));
        offset += 4;
        view.setUint8(offset, signature.length);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const sigbuf = te.encode(signature);
        // eslint-disable-next-line no-undef
        entries.push(Buffer.from(entry));
        entries.push(sigbuf);
    }
    // eslint-disable-next-line no-undef
    const buffer = Buffer.concat(entries);

    writeFileSync(`./src/selector/${filename}Hashes.min.jsonb`, buffer);
}

writeFileSync('./selectors/functionHashes.json', JSON.stringify(functionHashes, null, 4));
writeFileSync('./selectors/eventHashes.json', JSON.stringify(eventHashes, null, 4));

// serialize('function', functionHashes, 8);
// serialize('event', eventHashes, 64);

writeFileSync('./src/selector/functionHashes.min.json', JSON.stringify(functionHashes));
writeFileSync('./src/selector/eventHashes.min.json', JSON.stringify(eventHashes));

// eslint-disable-next-line no-undef
console.log('Updated hashes successfully');
