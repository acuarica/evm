import { expect } from 'chai';
import { EventFragment, FunctionFragment, ParamType } from 'ethers/lib/utils';
import { inspect } from 'util';
import * as functions from '../data/functions.json';
import * as events from '../data/events.json';

describe('data', () => {
    describe('functions.json', () => {
        it('should not contain duplicates', () => {
            expect(functions).to.deep.equal([...new Set(functions)]);
        });

        it('entries should not contain spaces (`storage` being an exception)', () => {
            expect(
                functions.filter(functionSig => functionSig.replace(/ storage/g, '').includes(' '))
            ).to.deep.equal([]);
        });

        it('entries should not contain semicolons', () => {
            expect(functions.filter(functionSig => functionSig.includes(';'))).to.deep.equal([]);
        });

        it('entries should be formatted correctly using `function(...arguments)` (example: `balanceOf(address)`)', () => {
            expect(
                functions.filter(
                    functionSig => !functionSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,._ [\]()]*\)$/)
                )
            ).to.deep.equal([]);
        });

        it('entries should contain valid arguments', () => {
            for (let functionSig of functions) {
                functionSig = functionSig.replace(/ storage/g, '');

                const func = FunctionFragment.from(functionSig);
                expect(functionSig, `${functionSig} may contain uint, int or byte`).to.be.equal(
                    func.format()
                );
                expect(
                    func.inputs.every(
                        isValidType(
                            paramType =>
                                paramType.includes('.') ||
                                paramType.charAt(0).toUpperCase() === paramType.charAt(0)
                        )
                    ),
                    `${functionSig}:${inspect(
                        func.inputs
                    )} does not seem to be a valid function signature`
                ).to.be.true;
            }
        }).timeout(10000);
    });

    describe('events.json', () => {
        it('should not contain duplicates', () => {
            expect(events).to.deep.equal([...new Set(events)]);
        });

        it('entries should not contain spaces', () => {
            expect(events.filter(eventSig => eventSig.includes(' '))).to.deep.equal([]);
        });

        it('entries should not contain semicolons', () => {
            expect(events.filter(eventSig => eventSig.includes(';'))).to.deep.equal([]);
        });

        it('entries should be formatted correctly using `Event(...arguments)` (example: `Transfer(address,address,uint256)`)', () => {
            expect(
                events.filter(eventSig => !eventSig.match(/^[a-zA-Z0-9_$]+\([a-zA-Z0-9,[\]()]*\)$/))
            ).to.deep.equal([]);
        });

        it('entries should contain valid arguments', () => {
            for (const eventSig of events) {
                const event = EventFragment.from(eventSig);
                expect(eventSig, `${eventSig} may contain uint|int|byte`).to.be.equal(
                    event.format()
                );
                expect(
                    event.inputs.every(isValidType(_paramType => false)),
                    `${eventSig}:${inspect(
                        event.inputs
                    )} does not seem to be a valid event signature`
                ).to.be.true;
            }
        });
    });
});

/**
 * The following elementary types exist[1]:
 *
 * - `uint<M>`: unsigned integer type of M bits, 0 < M <= 256, M % 8 == 0. e.g. uint32, uint8, uint256.
 * - `int<M>: two’s complement signed integer type of M bits, 0 < M <= 256, M % 8 == 0.
 * - `address`: equivalent to uint160, except for the assumed interpretation and language typing. For computing the function selector, address is used.
 * - `uint`, `int`: synonyms for uint256, int256 respectively. For computing the function selector, uint256 and int256 have to be used.
 * - `bool`: equivalent to uint8 restricted to the values 0 and 1. For computing the function selector, bool is used.
 * - `fixed<M>x<N>`: signed fixed-point decimal number of M bits, 8 <= M <= 256, M % 8 == 0, and 0 < N <= 80, which denotes the value v as v / (10 ** N).
 * - `ufixed<M>x<N>`: unsigned variant of fixed<M>x<N>.
 * - `fixed`, `ufixed`: synonyms for fixed128x18, ufixed128x18 respectively. For computing the function selector, fixed128x18 and ufixed128x18 have to be used.
 * - `bytes<M>`: binary type of M bytes, 0 < M <= 32.
 * - `function`: an address (20 bytes) followed by a function selector (4 bytes). Encoded identical to bytes24.
 *
 * [1] https://docs.soliditylang.org/en/v0.8.16/abi-spec.html#types
 */
const elemTypes = [
    'bool',
    'string',
    'address',
    'bytes',
    'function',
    ...[...Array(32).keys()]
        .map(i => i + 1)
        .reduce((a, i) => [...a, `bytes${i}`, `uint${i * 8}`, `int${i * 8}`], [] as string[]),
];

function isValidType(pred: (paramType: string) => boolean): (param: ParamType) => boolean {
    return function _isValidType(param: ParamType): boolean {
        return (
            elemTypes.includes(param.type) ||
            pred(param.type) ||
            (param.type === 'tuple' && param.components.every(_isValidType)) ||
            (param.baseType === 'array' && _isValidType(param.arrayChildren))
        );
    };
}
