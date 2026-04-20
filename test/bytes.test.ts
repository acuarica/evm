import { describe, test, expect } from 'vitest';

import { arrayify, hexlify } from '../src/bytes.ts';

// /**
//  * @template {[...unknown[]]} A
//  * @param {{ [K in keyof A]: A[K][] }} args
//  * @returns {A[]}
//  */
// function xprod(...args) {
//     return /** @type {A[]} */ (args.reduce(
//         /** @param {unknown[][]} prev */
//         (prev, curr) => prev.flatMap(x => curr.map(y => [...x, y])),
//         /** @type {unknown[][]} */([[]]),
//     ));
// }

describe('::bytes', () => {
    describe('arrayify', () => {
        test.each([
            '0',
            ' 0 ',
            '0x123',
        ])('should throw when input $0 has odd length', (data) => {
            expect(() => arrayify(data)).toThrow('input should have even length')
        });

        test.each([
            ['0x123x', '3x'],
            ['asdf', 'as'],
            ['0 ', '0 '],
            ['  ', '  '],
            ['0x 1 2 3', ' 1'],
            ['0x1 2 3 ', '1 '],
            ['0x1\n2\n3  \n', '1\n'],
        ])('should throw when input $0 has invalid hex byte', (data, invalidByte) => {
            expect(() => arrayify(data)).toThrow(`invalid hex byte '${invalidByte}'`);
        });

        test('should return a `Uint8Array` where each element is coerced to % 256', () => {
            const expected = Uint8Array.from([1, 2, 3, 0, 0xcd]);
            expect(arrayify([1, 2, 3, 256, 0xabcd])).toStrictEqual(expected);
        });
    });

    describe.each([
        ['', []],
        ['1234', [0x12, 0x34]],
        ['5678', [0x56, 0x78]],
        [
            '5425890298aed601595a70AB815c96711a31Bc65',
            [0x54, 0x25, 0x89, 0x02, 0x98, 0xae, 0xd6, 0x01, 0x59, 0x5a, 0x70, 0xAB, 0x81, 0x5c, 0x96, 0x71, 0x1a, 0x31, 0xBc, 0x65],
        ],
    ])('`arrayify`/`hexlify` of/return $0 <--> return/of `Uint8Array` $1', (data, array) => {
        test.each([
            '', '0x', '0X'
        ])('`arrayify` using prefix $0', (prefix) => {
            expect(arrayify(prefix + data)).toStrictEqual(Uint8Array.from(array));
        });

        test('`arrayify` should return the same reference when input is already a `Uint8Array`', () => {
            const data = Uint8Array.from(array);
            expect(arrayify(data)).toBe(data);
        });

        test('`arrayify` should return the same array when input is `ArrayLike<number>`', () => {
            expect(arrayify(array)).toStrictEqual(Uint8Array.from(array));
        });

        test('`hexlify` should return the original data (in lower case for hex chars)', () => {
            expect(hexlify(Uint8Array.from(array))).toStrictEqual(data.toLowerCase());
        });
    });
});