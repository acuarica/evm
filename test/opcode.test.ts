import { expect } from 'chai';

import { OPCODES, decode, formatOpcode, toHex, type Opcode, DecodeError } from 'sevm';

const decodeFromArray = (...opcodes: number[]) => decode(Buffer.from(opcodes).toString('hex'));

describe('opcode', function () {
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
            expect(() => decode(p + '1')).to.throw(DecodeError, 'input should have even length');
        });

        it(`should throw when input has an invalid number with prefix \`${p}\``, function () {
            expect(() => decode(p + 'gg')).to.throw(
                DecodeError,
                `invalid value found at ${p.length}`
            );
        });
    });

    it('should `decode` unary opcodes', function () {
        const { opcodes, jumpdests } = decodeFromArray(
            OPCODES.ADDRESS,
            OPCODES.ADDRESS,
            OPCODES.JUMPDEST,
            OPCODES.ADD
        );

        expect(opcodes).to.have.length(4);
        expect(opcodes[0]).to.be.deep.equal({
            pc: 0,
            opcode: OPCODES.ADDRESS,
            mnemonic: 'ADDRESS',
            pushData: null,
        } satisfies Opcode);
        expect(opcodes[1]).to.be.deep.equal({
            pc: 1,
            opcode: OPCODES.ADDRESS,
            mnemonic: 'ADDRESS',
            pushData: null,
        });
        expect(opcodes[2]).to.be.deep.equal({
            pc: 2,
            opcode: OPCODES.JUMPDEST,
            mnemonic: 'JUMPDEST',
            pushData: null,
        } satisfies Opcode);
        expect(opcodes[3]).to.be.deep.equal({
            pc: 3,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        } satisfies Opcode);
        expect(jumpdests).to.be.deep.equal({ '2': 2 });
    });

    it('should `decode` `PUSH`n opcodes', function () {
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
            pc: 0,
            opcode: OPCODES.PUSH4,
            mnemonic: 'PUSH4',
            pushData: Buffer.from([1, 2, 3, 4]),
        } satisfies Opcode);
        expect(opcodes[1]).to.be.deep.equal({
            pc: 5,
            opcode: OPCODES.JUMPDEST,
            mnemonic: 'JUMPDEST',
            pushData: null,
        } satisfies Opcode);
        expect(opcodes[2]).to.be.deep.equal({
            pc: 6,
            opcode: OPCODES.PUSH4,
            mnemonic: 'PUSH4',
            pushData: Buffer.from([5, 6, 7, 8]),
        } satisfies Opcode);
        expect(opcodes[3]).to.be.deep.equal({
            pc: 11,
            opcode: OPCODES.JUMPDEST,
            mnemonic: 'JUMPDEST',
            pushData: null,
        } satisfies Opcode);
        expect(opcodes[4]).to.be.deep.equal({
            pc: 12,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        } satisfies Opcode);
        expect(jumpdests).to.be.deep.equal({ '5': 1, '11': 3 });
    });

    it('should not fail `PUSH`n does not have enough data', function () {
        expect(decodeFromArray(OPCODES.PUSH32)).to.be.deep.equal({
            opcodes: [
                {
                    pc: 0,
                    opcode: OPCODES.PUSH32,
                    mnemonic: 'PUSH32',
                    pushData: Buffer.from([]),
                },
            ],
            jumpdests: {},
        });
        expect(decodeFromArray(OPCODES.PUSH32, 1)).to.be.deep.equal({
            opcodes: [
                {
                    pc: 0,
                    opcode: OPCODES.PUSH32,
                    mnemonic: 'PUSH32',
                    pushData: Buffer.from([1]),
                },
            ],
            jumpdests: {},
        });
    });

    it('should `decode` with `INVALID` opcodes', function () {
        const { opcodes } = decodeFromArray(0xb0, OPCODES.ADD, 0xb1);

        expect(opcodes).to.have.length(3);
        expect(opcodes[0]).to.be.deep.equal({
            pc: 0,
            opcode: 0xb0,
            mnemonic: 'INVALID',
            pushData: null,
        } satisfies Opcode);
        expect(opcodes[1]).to.be.deep.equal({
            pc: 1,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        } satisfies Opcode);
        expect(opcodes[2]).to.be.deep.equal({
            pc: 2,
            opcode: 0xb1,
            mnemonic: 'INVALID',
            pushData: null,
        } satisfies Opcode);
    });

    it('should `decode` example from hex string', function () {
        const { opcodes } = decode('0x6003600501');

        expect(opcodes).to.have.length(3);
        expect(opcodes[0]).to.be.deep.equal({
            pc: 0,
            opcode: OPCODES.PUSH1,
            mnemonic: 'PUSH1',
            pushData: Buffer.from([3]),
        } satisfies Opcode);
        expect(opcodes[1]).to.be.deep.equal({
            pc: 2,
            opcode: OPCODES.PUSH1,
            mnemonic: 'PUSH1',
            pushData: Buffer.from([5]),
        } satisfies Opcode);
        expect(opcodes[2]).to.be.deep.equal({
            pc: 4,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        } satisfies Opcode);
    });

    it('should `decode` all `INVALID` opcodes', function () {
        const { opcodes } = decode('0c0d0e0ffc');
        expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal(Array(5).fill('INVALID'));
    });

    it('should `decode` format `INVALID` opcodes', function () {
        expect(
            formatOpcode({
                pc: 2,
                opcode: OPCODES.ADD,
                mnemonic: 'ADD',
                pushData: null,
            })
        ).to.be.equal('   2  ADD');

        expect(
            formatOpcode({
                pc: 1,
                opcode: OPCODES.PUSH4,
                mnemonic: 'PUSH4',
                pushData: Buffer.from([1, 2, 3, 4]),
            })
        ).to.be.equal('   1  PUSH4 0x01020304 (16909060)');

        expect(
            formatOpcode({
                pc: 0,
                opcode: 0xb0,
                mnemonic: 'INVALID',
                pushData: null,
            })
        ).to.be.equal('   0  INVALID');
    });

    it('should convert buffer `toHex`', function () {
        const output = toHex(Buffer.from([1, 2, 3, 4, 12, 13, 14, 15, 254, 255, 0]));
        expect(output).to.be.equal('010203040c0d0e0ffeff00');
    });
});
