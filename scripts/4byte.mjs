#!/usr/bin/env node
/* eslint-env node */

import { readFileSync, writeFileSync } from 'fs';
import { keccak256, toUtf8Bytes } from 'ethers';
import c from 'ansi-colors';

/** @typedef {{ [hash: string]: string }} Hashes */

/**
 * @param {'functions'|'events'} name
 * @returns {string[]}
 */
function json(name) {
    console.info('Reading', c.cyan(name));
    return JSON.parse(readFileSync(`./data/${name}.json`, 'utf-8'));
}

/**
 * @param {string} name
 * @param {Hashes} data
 * @returns
 */
function writeJson(name, data) {
    console.info('Writing JSON', c.magenta(name));
    writeFileSync(`./data/${name}.json`, JSON.stringify(data, null, 4));
}

/**
 * @param {string} name
 * @param {Hashes} hashes
 * @returns
 */
function writeJs(name, hashes) {
    console.info('Writing JS', c.magenta(name));
    writeFileSync(
        `./4byte/${name}.min.js`,
        `/** @type {{ [hash: string]: string }} */\nmodule.exports = ${JSON.stringify(hashes)};`
    );
}

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
