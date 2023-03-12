import { expect } from 'chai';
import { decode, formatOpcode, Opcode, OPCODES } from '../src/opcode';

describe('opcode::', () => {
    it('should `decode` empty buffer', () => {
        const opcodes = decode(Buffer.from([]));

        expect(opcodes).to.be.empty;
    });

    it('should `decode` unary opcodes', () => {
        const opcodes = decode(Buffer.from([OPCODES.ADDRESS, OPCODES.ADDRESS, OPCODES.ADD]));

        expect(opcodes).to.have.length(3);
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
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        });
    });

    it('should `decode` `PUSH`n opcodes', () => {
        const opcodes = decode(
            Buffer.from([
                OPCODES.PUSH4,
                ...[1, 2, 3, 4],
                OPCODES.PUSH4,
                ...[5, 6, 7, 8],
                OPCODES.ADD,
            ])
        );

        expect(opcodes).to.have.length(3);
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
            opcode: OPCODES.PUSH4,
            mnemonic: 'PUSH4',
            pushData: Buffer.from([5, 6, 7, 8]),
        });
        expect(opcodes[2]).to.be.deep.equal({
            offset: 10,
            pc: 2,
            opcode: OPCODES.ADD,
            mnemonic: 'ADD',
            pushData: null,
        });
    });

    it('should not fail `PUSH`n does not have enough data', () => {
        expect(decode(Buffer.from([OPCODES.PUSH32]))).to.be.deep.equal([
            {
                offset: 0,
                pc: 0,
                opcode: OPCODES.PUSH32,
                mnemonic: 'PUSH32',
                pushData: Buffer.from([]),
            } satisfies Opcode,
        ]);

        expect(decode(Buffer.from([OPCODES.PUSH32, ...[1, 2, 3, 4]]))).to.deep.equal([
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
        const opcodes = decode(Buffer.from([0xb0, OPCODES.ADD, 0xb1]));

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
});
