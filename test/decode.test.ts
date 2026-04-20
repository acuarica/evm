import { describe, it, expect } from 'vitest';

import { Opcodes } from '../src/decode.ts';

describe('::decode', function () {
    describe('Opcodes', function () {
        it('should `decode` unary opcodes', function () {
            const ops = new Opcodes().build({
                STOP: 0,
                ADD: 1,
                MUL: 2,
                SUB: 3,
            });

            expect([...ops.decode('0x00010203020300')])
                .to.be.deep.equal([
                    new ops.Opcode(0, 'STOP'),
                    new ops.Opcode(1, 'ADD'),
                    new ops.Opcode(2, 'MUL'),
                    new ops.Opcode(3, 'SUB'),
                    new ops.Opcode(4, 'MUL'),
                    new ops.Opcode(5, 'SUB'),
                    new ops.Opcode(6, 'STOP'),
                ]);
        });

        it('should `decode` unary opcodes', function () {
            const ops = new Opcodes().build({
                STOP: 0,
                ADD: 1,
                MUL: 2,
                PUSH4: { opcode: 3, size: 4 },
            });

            expect([...ops.decode('0x0102030a0b0c0d00')])
                .to.be.deep.equal([
                    new ops.Opcode(0, 'ADD'),
                    new ops.Opcode(1, 'MUL'),
                    new ops.Opcode(2, 'PUSH4', new Uint8Array([10, 11, 12, 13])),
                    new ops.Opcode(7, 'STOP'),
                ]);

            for (const o of ops.decode('0x010203')) {
                if (o.opcode === ops.opcodes.PUSH4 ) {
                    // TODO
                    console.log(o.hexData()!.length);
                }

                // o._decode.
                // o.
            }
        });
    });
});