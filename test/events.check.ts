import { expect } from 'chai';
import { EventFragment, ParamType } from 'ethers/lib/utils';
import { inspect } from 'util';
import * as events from '../data/events.json';

describe('events.json', () => {
    it('should not contain duplicates', () => {
        expect(events).to.deep.equal([...new Set(events)]);
    });

    it('entries should not contain spaces', () => {
        expect(events.filter(eventName => eventName.includes(' '))).to.deep.equal([]);
    });

    it('entries should not contain semicolons', () => {
        expect(events.filter(eventName => eventName.includes(';'))).to.deep.equal([]);
    });

    it('entries should be formatted correctly using `Event(...arguments)` (example: `Transfer(address,address,uint256)`)', () => {
        expect(
            events.filter(eventName => !eventName.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,[\]()]*\)$/))
        ).to.deep.equal([]);
    });

    it('entries should contain valid arguments', () => {
        for (const eventSig of events) {
            const event = EventFragment.from(eventSig);
            expect(eventSig, `${eventSig} may contain uint|int|byte`).to.be.equal(event.format());
            expect(event.inputs.every(isValidType), inspect(event.inputs)).to.be.true;
        }
    });
});

const validTypes = [
    'bool',
    'string',
    'address',
    'bytes',
    'function',
    ...[...Array(32).keys()]
        .map(i => i + 1)
        .reduce((a, i) => [...a, `bytes${i}`, `uint${i * 8}`, `int${i * 8}`], [] as string[]),
];

function isValidType(param: ParamType): boolean {
    return (
        validTypes.includes(param.type) ||
        (param.type === 'tuple' && param.components.every(isValidType)) ||
        (param.baseType === 'array' && isValidType(param.arrayChildren))
    );
}
