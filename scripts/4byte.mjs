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
    const path = `./scripts/4byte/${fileName}.json`;
    console.info('Reading', c.cyan(fileName), 'from', c.magenta(path));
    return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * @param {string} fileName
 * @param {Hashes} hashes
 * @returns
 */
function writeJson(fileName, hashes) {
    const path = `./scripts/4byte/${fileName}.json`;
    const minPath = `./4byte/${fileName}.min.json`;

    console.info('Writing JSON', c.magenta(path), '| minified', c.magenta(minPath));

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

/**
 * @param {string} msg
 * @param {{ (): void }} fn
 */
function check(msg, fn) {
    console.info(c.blue(`  • ${msg}`));
    fn();
}

/**
 * @param {import('ethers').ParamType} param
 * @returns {boolean}
 */
function isValidType(param) {
    const BITS = [...Array(32).keys()].map(n => (n + 1) * 8);
    const BYTES = [...Array(32).keys()].map(n => n + 1);
    const ELEM_TYPES = [
        'address',
        'address payable',
        'bool',
        'uint',
        ...BITS.map(n => `uint${n}`),
        'int',
        ...BITS.map(n => `int${n}`),
        'bytes',
        ...BYTES.map(n => `bytes${n}`),
        'string',
        'function',
    ];
    return (
        ELEM_TYPES.includes(param.type) ||
        (param.baseType === 'tuple' &&
                /**@type{import('ethers').ParamType[]}*/ (param.components).every(isValidType)) ||
        (param.baseType === 'array' &&
            isValidType(/**@type{import('ethers').ParamType}*/(param.arrayChildren)))
    );
}

/**
 * @param {string[]} functions
 */
function validateFunctions(functions) {
    check('should not contain duplicates', function () {
        expect(functions).to.be.deep.equal([...new Set(functions)]);
    });

    check('entries should not contain spaces (`storage` being an exception)', function () {
        expect(
            functions.filter(functionSig => functionSig.replace(/ storage/g, '').includes(' '))
        ).to.be.deep.equal([]);
    });

    check('entries should not contain semicolons', function () {
        expect(functions.filter(functionSig => functionSig.includes(';'))).to.be.deep.equal([]);
    });

    check('entries should be formatted correctly using `function(...arguments)` (example: `balanceOf(address)`)', function () {
        expect(functions.filter(functionSig => !functionSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,._ [\]()]*\)$/)))
            .to.be.deep.equal([]);
    });

    check('entries should contain valid arguments', function () {
        for (let functionSig of functions) {
            functionSig = functionSig.replace(/ storage/g, '');
            if (functionSig.includes('.')) {
                continue;
            }

            let func;
            try {
                func = FunctionFragment.from(functionSig);
            } catch (e) {
                continue;
            }
            expect(functionSig, functionSig).to.be.equal(func.format());
            expect(func.inputs.every(isValidType), functionSig).to.be.true;
        }
    });
}

/** @param {string[]} events */
function validateEvents(events) {
    check('should not contain duplicates', function () {
        expect(events).to.deep.equal([...new Set(events)]);
    });

    check('entries should not contain spaces', function () {
        expect(events.filter(eventSig => eventSig.includes(' '))).to.be.deep.equal([]);
    });

    check('entries should not contain semicolons', function () {
        expect(events.filter(eventSig => eventSig.includes(';'))).to.be.deep.equal([]);
    });

    check('entries should be formatted correctly using `Event(...arguments)` (example: `Transfer(address,address,uint256)`)', function () {
        expect(events.filter(eventSig => !eventSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,[\]()]*\)$/)))
            .to.be.deep.equal([]);
    });

    check('entries should contain valid arguments', function () {
        for (const eventSig of events) {
            let event;
            try {
                event = EventFragment.from(eventSig);
            } catch (e) {
                continue;
            }
            expect(eventSig, eventSig).to.be.equal(event.format());
            expect(event.inputs.every(isValidType), eventSig).to.be.true;
        }
    });
}

function main() {
    const functions = json('functions');
    validateFunctions(functions);

    const events = json('events');
    validateEvents(events);

    const functionHashes = reduce(functions, s => s.substring(2, 10));
    const eventHashes = reduce(events, s => s.substring(2));

    writeJson('functionHashes', functionHashes);
    writeJson('eventHashes', eventHashes);

    console.info('Updated hashes successfully');
}

main();
