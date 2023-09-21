#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { keccak256, toUtf8Bytes } from 'ethers';

/**
 * @param {'functions'|'events'} name
 * @returns {string[]}
 */
const json = name => (console.info('Reading', name), JSON.parse(readFileSync(`./data/${name}.json`, 'utf-8')));

/**
 * @param {string} file 
 * @param {string} data 
 * @returns 
 */
const writeFile = (file, data) => (console.info('Writing', file), writeFileSync(file, data));

/** @typedef {{ [hash: string]: string }} Hashes */

/**
 * @param {string[]} entries
 * @param {(value: string) => string} replacer
 * @returns
 */
const reduce = (entries, replacer) =>
    entries.reduce((/** @type {Hashes}*/ map, /** @type {string}*/ entry) => {
        map[replacer(keccak256(toUtf8Bytes(entry)))] = entry;
        return map;
    }, {});

function main() {
    const functions = json('functions');
    const events = json('events');

    const functionHashes = reduce(functions, s => s.substring(2, 10));
    const eventHashes = reduce(events, s => s.substring(2));

    writeFile('./data/functionHashes.json', JSON.stringify(functionHashes, null, 4));
    writeFile('./data/eventHashes.json', JSON.stringify(eventHashes, null, 4));

    writeFile('./src/functionHashes.min.json', JSON.stringify(functionHashes));
    writeFile('./src/eventHashes.min.json', JSON.stringify(eventHashes));

    console.info('Updated hashes successfully');
}

main();
