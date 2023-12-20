import { expect } from 'chai';

import { toHex, STEP, Opcode } from 'sevm';

describe('opcode', function () {
    const step = STEP();
    const OPCODES = step.opcodes();
    const decode = step.decode.bind(step);

    const decodeArray = (...opcodes: number[]) => decode(Buffer.from(opcodes).toString('hex'));

    ['', '0x'].forEach(p => {
        it(`should \`decode\` empty buffer with prefix \`${p}\``, function () {
            const { opcodes, jumpdests } = decode(p + '');
            expect(opcodes).to.be.empty;
            expect(jumpdests).to.be.empty;
        });

        it(`should \`decode\` opcodes with prefix \`${p}\``, function () {
            const { opcodes } = decode(p + '00010203');
            expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal(['STOP', 'ADD', 'MUL', 'SUB']);
        });

        it(`should throw when input is not even with prefix \`${p}\``, function () {
            expect(() => decode(p + '1')).to.throw('input should have even length');
        });

        it(`should throw when input has an invalid number with prefix \`${p}\``, function () {
            expect(() => decode(p + 'gg')).to.throw(
                `invalid value found at ${p.length}`
            );
        });
    });

    it('should `decode` unary opcodes', function () {
        const { opcodes, jumpdests } = decodeArray(
            OPCODES.ADDRESS,
            OPCODES.ADDRESS,
            OPCODES.JUMPDEST,
            OPCODES.ADD
        );

        expect(opcodes).to.be.deep.equal([
            new Opcode(0, OPCODES.ADDRESS, 'ADDRESS', null),
            new Opcode(1, OPCODES.ADDRESS, 'ADDRESS', null),
            new Opcode(2, OPCODES.JUMPDEST, 'JUMPDEST', null),
            new Opcode(3, OPCODES.ADD, 'ADD', null),
        ]);
        expect(jumpdests).to.be.deep.equal({ '2': 2 });
    });

    it('should `decode` `PUSH`n opcodes', function () {
        const { opcodes, jumpdests } = decodeArray(
            OPCODES.PUSH4,
            ...[1, 2, 3, 4],
            OPCODES.JUMPDEST,
            OPCODES.PUSH4,
            ...[5, 6, 7, 8],
            OPCODES.JUMPDEST,
            OPCODES.ADD
        );

        expect(opcodes).to.be.deep.equal([
            new Opcode(0, OPCODES.PUSH4, 'PUSH4', Buffer.from([1, 2, 3, 4])),
            new Opcode(5, OPCODES.JUMPDEST, 'JUMPDEST', null),
            new Opcode(6, OPCODES.PUSH4, 'PUSH4', Buffer.from([5, 6, 7, 8])),
            new Opcode(11, OPCODES.JUMPDEST, 'JUMPDEST', null),
            new Opcode(12, OPCODES.ADD, 'ADD', null),
        ]);
        expect(jumpdests).to.be.deep.equal({ '5': 1, '11': 3 });
    });

    it('should not fail `PUSH`n does not have enough data', function () {
        expect(decodeArray(OPCODES.PUSH32)).to.be.deep.equal({
            opcodes: [new Opcode(0, OPCODES.PUSH32, 'PUSH32', Buffer.from([]))],
            jumpdests: {},
        });
        expect(decodeArray(OPCODES.PUSH32, 1)).to.be.deep.equal({
            opcodes: [new Opcode(0, OPCODES.PUSH32, 'PUSH32', Buffer.from([1]))],
            jumpdests: {},
        });
    });

    it('should `decode` with `INVALID` opcodes', function () {
        const { opcodes } = decodeArray(0xb0, OPCODES.ADD, 0xb1);

        expect(opcodes).to.be.deep.equal([
            new Opcode(0, 0xb0, 'UNDEF', null),
            new Opcode(1, OPCODES.ADD, 'ADD', null),
            new Opcode(2, 0xb1, 'UNDEF', null),
        ]);
    });

    it('should `decode` example from hex string', function () {
        const { opcodes } = decode('0x6003600501');

        expect(opcodes).to.be.deep.equal([
            new Opcode(0, OPCODES.PUSH1, 'PUSH1', Buffer.from([3])),
            new Opcode(2, OPCODES.PUSH1, 'PUSH1', Buffer.from([5])),
            new Opcode(4, OPCODES.ADD, 'ADD', null),
        ]);
    });

    it('should `decode` all `INVALID` opcodes', function () {
        const { opcodes } = decode('0c0d0e0ffc');
        expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal(Array(5).fill('UNDEF'));
    });

    it('should `decode` format `INVALID` opcodes', function () {
        expect(new Opcode(2, OPCODES.ADD, 'ADD', null).format())
            .to.be.equal('@2:ADD(0x1)');
        expect(new Opcode(1, OPCODES.PUSH4, 'PUSH4', Buffer.from([1, 2, 3, 4])).format())
            .to.be.equal('@1:PUSH4(0x63) 0x01020304 (16909060)');
        expect(new Opcode(0, 0xb0, 'INVALID', null).format())
            .to.be.equal('@0:INVALID(0xb0)');
    });

    it('should convert buffer `toHex`', function () {
        const output = toHex(Buffer.from([1, 2, 3, 4, 12, 13, 14, 15, 254, 255, 0]));
        expect(output).to.be.equal('010203040c0d0e0ffeff00');
    });
});
