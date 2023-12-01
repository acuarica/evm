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
    console.info('Reading', c.cyan(fileName));
    return JSON.parse(readFileSync(`./data/${fileName}.json`, 'utf-8'));
}

/**
 * @param {string} fileName
 * @param {Hashes} data
 * @returns
 */
function writeJson(fileName, data) {
    const path = `./data/${fileName}.json`;
    console.info('Writing JSON', c.magenta(path));
    writeFileSync(path, JSON.stringify(data, null, 4));
}

/**
 * @param {string} fileName
 * @param {Hashes} hashes
 * @returns
 */
function writeMinJson(fileName, hashes) {
    const path = `./4byte/${fileName}.min.json`;
    console.info('Writing minified JSON', c.magenta(path));
    writeFileSync(path, JSON.stringify(hashes));
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
 * @param {string[]} functions
 * @param {string[]} events
 */
function validate(functions, events) {
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

    const stats = {
        lengthyFunctionSigs: /**@type {string[]}*/ ([]),
        lengthyEventSigs: /**@type {string[]}*/ ([]),
    };

    desc('functions.json', function () {
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

        check(
            'entries should be formatted correctly using `function(...arguments)` (example: `balanceOf(address)`)',
            function () {
                expect(
                    functions.filter(
                        functionSig =>
                            !functionSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,._ [\]()]*\)$/)
                    )
                ).to.be.deep.equal([]);
            }
        );

        check('entries should contain valid arguments', function () {
            for (let functionSig of functions) {
                if (functionSig.length >= 256) {
                    stats.lengthyFunctionSigs.push(functionSig);
                }

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
    });

    desc('events.json', function () {
        check('should not contain duplicates', function () {
            expect(events).to.deep.equal([...new Set(events)]);
        });

        check('entries should not contain spaces', function () {
            expect(events.filter(eventSig => eventSig.includes(' '))).to.be.deep.equal([]);
        });

        check('entries should not contain semicolons', function () {
            expect(events.filter(eventSig => eventSig.includes(';'))).to.be.deep.equal([]);
        });

        check(
            'entries should be formatted correctly using `Event(...arguments)` (example: `Transfer(address,address,uint256)`)',
            function () {
                expect(
                    events.filter(
                        eventSig => !eventSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,[\]()]*\)$/)
                    )
                ).to.be.deep.equal([]);
            }
        );

        check('entries should contain valid arguments', function () {
            for (const eventSig of events) {
                if (eventSig.length >= 256) {
                    stats.lengthyEventSigs.push(eventSig);
                }

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
    });

    const info = c.blue;
    const warn = c.yellow;

    /**
     * @param {string} title
     * @param {string[]} sigs
     * @returns
     */
    const statsinfo = (title, sigs) =>
        console.info(`    • ${info('Lengthy ' + title)} ${warn(sigs.length.toString())}`);

    console.info('\n  Signature Stats');
    statsinfo('Functions', stats.lengthyFunctionSigs);
    statsinfo('Events', stats.lengthyEventSigs);

    /**
     * @param {string} name
     * @param {{(): void}} fn
     */
    function desc(name, fn) {
        console.info('Validate', c.cyan(name));
        fn();
    }

    /**
     * @param {import('ethers').ParamType} param
     * @returns {boolean}
     */
    function isValidType(param) {
        return (
            ELEM_TYPES.includes(param.type) ||
            (param.baseType === 'tuple' &&
                /**@type{import('ethers').ParamType[]}*/ (param.components).every(isValidType)) ||
            (param.baseType === 'array' &&
                isValidType(/**@type{import('ethers').ParamType}*/ (param.arrayChildren)))
        );
    }
}

function main() {
    const functions = json('functions');
    const events = json('events');

    validate(functions, events);

    const functionHashes = reduce(functions, s => s.substring(2, 10));
    const eventHashes = reduce(events, s => s.substring(2));

    writeJson('functionHashes', functionHashes);
    writeJson('eventHashes', eventHashes);

    writeMinJson('functionHashes', functionHashes);
    writeMinJson('eventHashes', eventHashes);

    console.info('Updated hashes successfully');
}

main();
