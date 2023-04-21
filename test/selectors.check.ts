import { readFileSync } from 'fs';
import { expect } from 'chai';
import { EventFragment, FunctionFragment, type ParamType } from 'ethers/lib/utils';

import { isElemType } from '../src/type';

const json = (f: string) => JSON.parse(readFileSync(`./selectors/${f}.json`, 'utf-8')) as string[];
const functions = json('functions');
const events = json('events');

describe('selectors', () => {
    describe('functions.json', () => {
        it('should not contain duplicates', () => {
            expect(functions).to.be.deep.equal([...new Set(functions)]);
        });

        it('entries should not contain spaces (`storage` being an exception)', () => {
            expect(
                functions.filter(functionSig => functionSig.replace(/ storage/g, '').includes(' '))
            ).to.be.deep.equal([]);
        });

        it('entries should not contain semicolons', () => {
            expect(functions.filter(functionSig => functionSig.includes(';'))).to.be.deep.equal([]);
        });

        it('entries should be formatted correctly using `function(...arguments)` (example: `balanceOf(address)`)', () => {
            expect(
                functions.filter(
                    functionSig => !functionSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,._ [\]()]*\)$/)
                )
            ).to.be.deep.equal([]);
        });

        it('entries should contain valid arguments', () => {
            for (let functionSig of functions) {
                functionSig = functionSig.replace(/ storage/g, '');

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
            }
        }).timeout(20000);
    });

    describe('events.json', () => {
        it('should not contain duplicates', () => {
            expect(events).to.deep.equal([...new Set(events)]);
        });

        it('entries should not contain spaces', () => {
            expect(events.filter(eventSig => eventSig.includes(' '))).to.be.deep.equal([]);
        });

        it('entries should not contain semicolons', () => {
            expect(events.filter(eventSig => eventSig.includes(';'))).to.be.deep.equal([]);
        });

        it('entries should be formatted correctly using `Event(...arguments)` (example: `Transfer(address,address,uint256)`)', () => {
            expect(
                events.filter(eventSig => !eventSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,[\]()]*\)$/))
            ).to.be.deep.equal([]);
        });

        it('entries should contain valid arguments', () => {
            for (const eventSig of events) {
                const event = EventFragment.from(eventSig);
                expect(eventSig, eventSig).to.be.equal(event.format());
                expect(event.inputs.every(isValidType(_paramType => false)), eventSig).to.be.true;
            }
        });
    });
});

function isValidType(pred: (paramType: string) => boolean): (param: ParamType) => boolean {
    return function _isValidType(param: ParamType): boolean {
        return (
            isElemType(param.type) ||
            pred(param.type) ||
            (param.type === 'tuple' && param.components.every(_isValidType)) ||
            (param.baseType === 'array' && _isValidType(param.arrayChildren))
        );
    };
}
