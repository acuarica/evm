#!/usr/bin/env node
/* eslint-env node */

import c from 'ansi-colors';
import { expect } from 'chai';
import { createHash } from 'crypto';
import { EventFragment, FunctionFragment } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';
import js_sha3 from 'js-sha3';

/** @typedef {{ [hash: string]: string }} Hashes */

/**
 * @param {'functions'|'events'} fileName
 * @param {{ (entries: string[]): void }} checkFn
 * @param {{ (entries: string[]): void }} writeFn
 */
function json(fileName, checkFn, writeFn) {
    const dir = './scripts/4bytedb';
    process.stdout.write(`${c.magenta(dir)}/${c.cyan(fileName)}${c.magenta('.json')} `);
    const file = readFileSync(`${dir}/${fileName}.json`, 'utf8');
    const entries = /** @type {string[]} */(JSON.parse(file));
    const hash = createHash('md5').update(file).digest('hex');

    const done = function () {
        let cachedHash;
        try {
            cachedHash = readFileSync(`${dir}/${fileName}.md5`, 'utf8');
            const match = cachedHash === hash;
            const msg = match ? c.green('[# ☑︎ ] ') : c.yellow('[#] ');
            process.stdout.write(msg);
            return match;
        } catch (_err) {
            process.stdout.write(c.dim('[no #] '));
            return false;
        }
    }();
    if (!done) {
        checkFn(entries);
        process.stdout.write(c.green('[OK] '));
        writeFn(entries);
        writeFileSync(`${dir}/${fileName}.md5`, hash);
    } else {
        console.info();
    }
}

/**
 * @param {string} fileName
 * @param {Hashes} hashes
 * @returns
 */
function writeJson(fileName, hashes) {
    const path = `./scripts/4bytedb/${fileName}.json`;
    const minPath = `./4bytedb/${fileName}.min.json`;

    console.info(c.dim('->'), c.blue(minPath));

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
        map[replacer(js_sha3.keccak256(entry))] = entry;
        return map;
    }, {});

function main() {
    json('functions', functions => {
        const s = new Set();
        for (const fn of functions) {
            const func = FunctionFragment.from(fn);
            expect(fn).to.be.equal(func.format());
            s.add(fn);
        }
        expect(functions.length).to.be.equal(s.size);
    }, functions => {
        const functionHashes = reduce(functions, s => s.substring(0, 8));
        writeJson('functionHashes', functionHashes);
    });

    json('events', events => {
        const s = new Set();
        for (const ev of events) {
            const event = EventFragment.from(ev);
            expect(ev).to.be.equal(event.format());
            s.add(ev);
        }
        expect(events.length).to.be.equal(s.size);
    }, events => {
        const eventHashes = reduce(events, s => s);
        writeJson('eventHashes', eventHashes);
    });
}

main();
