import { expect } from 'chai';
import { decode, formatOpcode, type Opcode, OPCODES, toHex } from '../src/opcode';

const decodeFromArray = (...opcodes: number[]) => decode(Buffer.from(opcodes).toString('hex'));

describe('opcode', () => {
    ['', '0x'].forEach(p => {
        it(`should \`decode\` empty buffer with prefix \`${p}\``, () => {
            const { opcodes, jumpdests } = decode(p + '');

            expect(opcodes).to.be.empty;
            expect(jumpdests).to.be.empty;
        });

        it(`should \`decode\` opcodes with prefix \`${p}\``, () => {
            const { opcodes } = decode(p + '00010203');
            expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal(['STOP', 'ADD', 'MUL', 'SUB']);
        });

        it(`should throw when input is not even with prefix \`${p}\``, () => {
            expect(() => decode(p + '1')).to.throw('input should have even length');
        });

        it(`should throw when input has an invalid number with prefix \`${p}\``, () => {
            expect(() => decode(p + '010x')).to.throw(`invalid value at ${p.length + 2}`);
        });
    });

    it('should `decode` unary opcodes', () => {
        const { opcodes, jumpdests } = decodeFromArray(
            OPCODES.ADDRESS,
            OPCODES.ADDRESS,
            OPCODES.JUMPDEST,
            OPCODES.ADD
        );

        expect(opcodes).to.have.length(4);
        expect(opcodes[0]).to.be.deep.equal({
            offset: 0,
            pc: 0,
            opcode: OPCODES.ADDRESS,
            mnemonic: 'ADDRESS',
            pushData: null,
        });
        expect(opcodes[1]).to.be.deep.equal({
            offset: 1,
            pc: 1,
            opcode: OPCODES.ADDRESS,
            mnemonic: 'ADDRESS',
            pushData: null,
        });
        expect(opcodes[2]).to.be.deep.equal({
            offset: 2,
            pc: 2,
            opcode: OPCODES.JUMPDEST,
            mnemonic: 'JUMPDEST',
            pushData: null,
        });
        expect(opcodes[3]).to.be.deep.equal({
            offset: 3,
            pc: 3,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        });
        expect(jumpdests).to.be.deep.equal({ '2': 2 });
    });

    it('should `decode` `PUSH`n opcodes', () => {
        const { opcodes, jumpdests } = decodeFromArray(
            OPCODES.PUSH4,
            ...[1, 2, 3, 4],
            OPCODES.JUMPDEST,
            OPCODES.PUSH4,
            ...[5, 6, 7, 8],
            OPCODES.JUMPDEST,
            OPCODES.ADD
        );

        expect(opcodes).to.have.length(5);
        expect(opcodes[0]).to.be.deep.equal({
            offset: 0,
            pc: 0,
            opcode: OPCODES.PUSH4,
            mnemonic: 'PUSH4',
            pushData: Buffer.from([1, 2, 3, 4]),
        });
        expect(opcodes[1]).to.be.deep.equal({
            offset: 5,
            pc: 1,
            opcode: OPCODES.JUMPDEST,
            mnemonic: 'JUMPDEST',
            pushData: null,
        });
        expect(opcodes[2]).to.be.deep.equal({
            offset: 6,
            pc: 2,
            opcode: OPCODES.PUSH4,
            mnemonic: 'PUSH4',
            pushData: Buffer.from([5, 6, 7, 8]),
        });
        expect(opcodes[3]).to.be.deep.equal({
            offset: 11,
            pc: 3,
            opcode: OPCODES.JUMPDEST,
            mnemonic: 'JUMPDEST',
            pushData: null,
        });
        expect(opcodes[4]).to.be.deep.equal({
            offset: 12,
            pc: 4,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        });
        expect(jumpdests).to.be.deep.equal({ '5': 1, '11': 3 });
    });

    it('should not fail `PUSH`n does not have enough data', () => {
        expect(decodeFromArray(OPCODES.PUSH32).opcodes).to.be.deep.equal([
            {
                offset: 0,
                pc: 0,
                opcode: OPCODES.PUSH32,
                mnemonic: 'PUSH32',
                pushData: Buffer.from([]),
            } satisfies Opcode,
        ]);

        expect(decodeFromArray(OPCODES.PUSH32, ...[1, 2, 3, 4]).opcodes).to.deep.equal([
            {
                offset: 0,
                pc: 0,
                opcode: OPCODES.PUSH32,
                mnemonic: 'PUSH32',
                pushData: Buffer.from([1, 2, 3, 4]),
            } satisfies Opcode,
        ]);
    });

    it('should `decode` with `INVALID` opcodes', () => {
        const { opcodes } = decodeFromArray(0xb0, OPCODES.ADD, 0xb1);

        expect(opcodes).to.have.length(3);
        expect(opcodes[0]).to.be.deep.equal({
            offset: 0,
            pc: 0,
            opcode: 0xb0,
            mnemonic: 'INVALID',
            pushData: null,
        });
        expect(opcodes[1]).to.be.deep.equal({
            offset: 1,
            pc: 1,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        });
        expect(opcodes[2]).to.be.deep.equal({
            offset: 2,
            pc: 2,
            opcode: 0xb1,
            mnemonic: 'INVALID',
            pushData: null,
        });
    });

    it('should `decode` all `INVALID` opcodes', () => {
        const { opcodes } = decode('0c0d0e0ffc');
        expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal(Array(5).fill('INVALID'));
    });

    it('should `decode` format `INVALID` opcodes', () => {
        expect(
            formatOpcode({
                offset: 10,
                pc: 2,
                opcode: OPCODES.ADD,
                mnemonic: 'ADD',
                pushData: null,
            })
        ).to.be.equal('   2:  10    ADD');

        expect(
            formatOpcode({
                offset: 5,
                pc: 1,
                opcode: OPCODES.PUSH4,
                mnemonic: 'PUSH4',
                pushData: Buffer.from([1, 2, 3, 4]),
            })
        ).to.be.equal('   1:   5    PUSH4 0x01020304 (16909060)');

        expect(
            formatOpcode({
                offset: 0,
                pc: 0,
                opcode: 0xb0,
                mnemonic: 'INVALID',
                pushData: null,
            })
        ).to.be.equal('   0:   0    INVALID');
    });

    it('should convert buffer `toHex`', () => {
        const output = toHex(Buffer.from([1, 2, 3, 4, 12, 13, 14, 15, 254, 255, 0]));
        expect(output).to.be.equal('010203040c0d0e0ffeff00');
    });
});
