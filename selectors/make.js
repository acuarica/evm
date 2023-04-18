const { writeFileSync } = require('fs');
const { utils } = require('ethers');

const functions = require('./functions.json');
const events = require('./events.json');

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

console.log('Updated hashes successfully');
