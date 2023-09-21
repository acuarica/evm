#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { keccak256, toUtf8Bytes } from 'ethers';

/** @typedef {{ [hash: string]: string }} Hashes */

/**
 * @param {'functions'|'events'} name
 * @returns {string[]}
 */
const json = name => (console.info('Reading', name), JSON.parse(readFileSync(`./data/${name}.json`, 'utf-8')));

/**
 * @param {string} name 
 * @param {Hashes} data 
 * @returns 
 */
const writeJson = (name, data) => (console.info('Writing JSON', name), writeFileSync(`./data/${name}.json`, JSON.stringify(data, null, 4)));

/**
 * @param {string} name 
 * @param {Hashes} data 
 * @returns 
 */
const writeJs = (name, data) => (console.info('Writing JS', name), writeFileSync(`./src/${name}.min.js`, 'export default ' + JSON.stringify(data) + ';'));

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

    writeJson('functionHashes', functionHashes);
    writeJson('eventHashes', eventHashes);

    writeJs('functionHashes', functionHashes);
    writeJs('eventHashes', eventHashes);

    console.info('Updated hashes successfully');
}

main();
