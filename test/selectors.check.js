import { readFileSync } from 'fs';
import { expect } from 'chai';

import { EventFragment, FunctionFragment } from 'ethers';
import c from 'ansi-colors';

import { isElemType } from 'sevm';

/**
 * @param {'functions'|'events'} file
 * @returns {string[]}
 */
const json = file => JSON.parse(readFileSync(`./data/${file}.json`, 'utf-8'));

const functions = json('functions');
const events = json('events');

describe('selectors', function () {
    const stats = {
        lengthyFunctionSigs: /**@type {string[]}*/ ([]),
        lengthyEventSigs: /**@type {string[]}*/ ([]),
    };

    describe('functions.json', function () {
        it('should not contain duplicates', function () {
            expect(functions).to.be.deep.equal([...new Set(functions)]);
        });

        it('entries should not contain spaces (`storage` being an exception)', function () {
            expect(
                functions.filter(functionSig => functionSig.replace(/ storage/g, '').includes(' '))
            ).to.be.deep.equal([]);
        });

        it('entries should not contain semicolons', function () {
            expect(functions.filter(functionSig => functionSig.includes(';'))).to.be.deep.equal([]);
        });

        it('entries should be formatted correctly using `function(...arguments)` (example: `balanceOf(address)`)', function () {
            expect(
                functions.filter(
                    functionSig => !functionSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,._ [\]()]*\)$/)
                )
            ).to.be.deep.equal([]);
        });

        it('entries should contain valid arguments', function () {
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
        }).timeout(20000);
    });

    describe('events.json', function () {
        it('should not contain duplicates', function () {
            expect(events).to.deep.equal([...new Set(events)]);
        });

        it('entries should not contain spaces', function () {
            expect(events.filter(eventSig => eventSig.includes(' '))).to.be.deep.equal([]);
        });

        it('entries should not contain semicolons', function () {
            expect(events.filter(eventSig => eventSig.includes(';'))).to.be.deep.equal([]);
        });

        it('entries should be formatted correctly using `Event(...arguments)` (example: `Transfer(address,address,uint256)`)', function () {
            expect(
                events.filter(eventSig => !eventSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,[\]()]*\)$/))
            ).to.be.deep.equal([]);
        });

        it('entries should contain valid arguments', function () {
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
        }).timeout(10000);
    });

    after(function () {
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
    });
});

/**
 * @param {import('ethers').ParamType} param
 * @returns {boolean}
 */
function isValidType(param) {
    return (
        isElemType(param.type) ||
        (param.baseType === 'tuple' &&
            /**@type{import('ethers').ParamType[]}*/ (param.components).every(isValidType)) ||
        (param.baseType === 'array' &&
            isValidType(/**@type{import('ethers').ParamType}*/ (param.arrayChildren)))
    );
}
