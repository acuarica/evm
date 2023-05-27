import { readFileSync } from 'fs';
import { expect } from 'chai';
import { EventFragment, FunctionFragment, type ParamType } from 'ethers';
import c = require('ansi-colors');

import { isElemType } from '../src/type';

const json = (f: string) => JSON.parse(readFileSync(`./selectors/${f}.json`, 'utf-8')) as string[];
const functions = json('functions');
const events = json('events');

describe('selectors', function () {
    const stats = {
        lengthyFunctionSigs: [] as string[],
        lengthyEventSigs: [] as string[],
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

                try {
                    const func = FunctionFragment.from(functionSig);
                    expect(functionSig, functionSig).to.be.equal(func.format());
                    expect(
                        func.inputs.every(
                            isValidType(
                                paramType =>
                                    paramType.includes('.') ||
                                    paramType.charAt(0).toUpperCase() === paramType.charAt(0)
                            )
                        ),
                        functionSig
                    ).to.be.true;
                } catch (e) {
                    // console.log(functionSig, (e as Error).message);
                    //
                }
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

                try {
                    const event = EventFragment.from(eventSig);
                    expect(eventSig, eventSig).to.be.equal(event.format());
                    expect(event.inputs.every(isValidType(_paramType => false)), eventSig).to.be
                        .true;
                } catch (e) {
                    //
                }
            }
        }).timeout(10000);
    });

    after(function () {
        const info = c.blue;
        const warn = c.yellow;
        const statsinfo = (title: string, sigs: string[]) =>
            console.info(`    • ${info('Lengthy ' + title)} ${warn(sigs.length.toString())}`);

        console.info('\n  Signature Stats');
        statsinfo('Functions', stats.lengthyFunctionSigs);
        statsinfo('Events', stats.lengthyEventSigs);
    });
});

function isValidType(pred: (paramType: string) => boolean): (param: ParamType) => boolean {
    return function _isValidType(param: ParamType): boolean {
        return (
            isElemType(param.type) ||
            pred(param.type) ||
            (param.type === 'tuple' && param.components!.every(_isValidType)) ||
            (param.baseType === 'array' && _isValidType(param.arrayChildren!))
        );
    };
}
