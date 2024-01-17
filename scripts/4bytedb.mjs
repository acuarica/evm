#!/usr/bin/env node
/* eslint-env node */

import { readFileSync, writeFileSync } from 'fs';
import { keccak256, toUtf8Bytes, EventFragment, FunctionFragment } from 'ethers';
import c from 'ansi-colors';
import { expect } from 'chai';

/** @typedef {{ [hash: string]: string }} Hashes */

/**
 * @param {'functions'|'events'} fileName
 * @returns {string[]}
 */
function json(fileName) {
    const path = `./scripts/4bytedb/${fileName}.json`;
    const [dir, ext] = path.split(fileName).map(c.magenta);
    process.stderr.write(`${dir}${c.cyan(fileName)}${ext} `);
    return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * @param {string} fileName
 * @param {Hashes} hashes
 * @returns
 */
function writeJson(fileName, hashes) {
    const path = `./scripts/4bytedb/${fileName}.json`;
    const minPath = `./4bytedb/${fileName}.min.json`;

    console.info(c.dim('->'), c.blue(path), c.blue(minPath));

    writeFileSync(path, JSON.stringify(hashes, null, 4));
    writeFileSync(minPath, JSON.stringify(hashes));
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

/** @param {{ (): void }} fn */
function check(fn) {
    fn();
    process.stdout.write(c.green('[OK] '));
}

function main() {
    const functions = json('functions');
    check(function () {
        const s = new Set();
        for (const fn of functions) {
            const func = FunctionFragment.from(fn);
            expect(fn).to.be.equal(func.format());
            s.add(fn);
        }
        expect(functions.length).to.be.equal(s.size);
    });
    const functionHashes = reduce(functions, s => s.substring(2, 10));
    writeJson('functionHashes', functionHashes);

    const events = json('events');
    check(function () {
        const s = new Set();
        for (const ev of events) {
            const event = EventFragment.from(ev);
            expect(ev).to.be.equal(event.format());
            s.add(ev);
        }
        expect(events.length).to.be.equal(s.size);
    });
    const eventHashes = reduce(events, s => s.substring(2));
    writeJson('eventHashes', eventHashes);
}

main();
