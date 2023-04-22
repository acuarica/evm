import { readFileSync, writeFileSync } from 'fs';
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

writeFileSync('./selectors/functionHashes.json', JSON.stringify(functionHashes, null, 4));
writeFileSync('./selectors/eventHashes.json', JSON.stringify(eventHashes, null, 4));

writeFileSync('./src/selector/functionHashes.min.json', JSON.stringify(functionHashes));
writeFileSync('./src/selector/eventHashes.min.json', JSON.stringify(eventHashes));

// eslint-disable-next-line no-undef
console.log('Updated hashes successfully');
