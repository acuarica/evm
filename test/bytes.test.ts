import { describe, it, expect } from 'vitest';

import { arrayify, hexlify, bigintify } from '../src/bytes.ts';

describe('::bytes', () => {
    describe('arrayify', () => {
        it.each([
            '0',
            ' 0 ',
            '0x123',
        ])('should throw when input $0 has odd length', (data) => {
            expect(() => arrayify(data)).toThrow('input should have even length')
        });

        it.each([
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

        it('should return a `Uint8Array` where each element is coerced to % 256', () => {
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
        it.each([
            '', '0x', '0X'
        ])('`arrayify` using prefix $0', prefix => {
            expect(arrayify(prefix + data)).toStrictEqual(Uint8Array.from(array));
        });

        it('`arrayify` should return the same reference when input is already a `Uint8Array`', () => {
            const data = Uint8Array.from(array);
            expect(arrayify(data)).toBe(data);
        });

        it('`arrayify` should return the same array when input is `ArrayLike<number>`', () => {
            expect(arrayify(array)).toStrictEqual(Uint8Array.from(array));
        });

        it('`hexlify` should return the original data (in lower case for hex chars)', () => {
            expect(hexlify(Uint8Array.from(array))).toStrictEqual(data.toLowerCase());
        });
    });

    describe('bigintify ', () => {
        it('should return `0n` for empty buffer', () => {
            expect(bigintify(new Uint8Array())).toStrictEqual(0n);
        });

        it.each([
            '0xff',
            '0x1234',
            '0x001234',
            '0x00123400',
            '0xffffffff',
            '0x0123456789',
            '0x3FDA67f7583380E67ef93072294a7fAc882FD7E7',
        ])('should return the same as hexlify $0', value => {
            const buf = arrayify(value);
            expect(bigintify(buf)).toStrictEqual(BigInt('0x' + hexlify(buf)));
        });
    });
});