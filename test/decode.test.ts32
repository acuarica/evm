import { describe, it, expect } from 'vitest';

import { Dispatch, formatOpcode } from '../src/decode.ts';
import { parseMetadata } from '../src/metadata.ts';

import { compile } from './utils/solc.ts';
import { arrayify, hexlify } from '../src/bytes.ts';
// import { fnselector } from './utils/selector.ts';

describe('::dispatch', function () {
    it('should decode unary opcodes', function () {
        const ops = new Dispatch({
            STOP: { op: 0 },
            ADD: { op: 1 },
            MUL: { op: 2 },
            SUB: { op: 3 },
            NULL: { op: 0xa },
        }, 'NULL');

        expect([...ops.decode(arrayify('0x0001020302030a000bff'), 0)]).toEqual([
            { pc: 0, nextpc: 1, op: 0, mnemonic: 'STOP' },
            { pc: 1, nextpc: 2, op: 1, mnemonic: 'ADD' },
            { pc: 2, nextpc: 3, op: 2, mnemonic: 'MUL' },
            { pc: 3, nextpc: 4, op: 3, mnemonic: 'SUB' },
            { pc: 4, nextpc: 5, op: 2, mnemonic: 'MUL' },
            { pc: 5, nextpc: 6, op: 3, mnemonic: 'SUB' },
            { pc: 6, nextpc: 7, op: 0xa, mnemonic: 'NULL' },
            { pc: 7, nextpc: 8, op: 0, mnemonic: 'STOP' },
            { pc: 8, nextpc: 9, op: 0xb, mnemonic: 'NULL' },
            { pc: 9, nextpc: 10, op: 0xff, mnemonic: 'NULL' },
        ]);
    });

    it('should decode data opcodes', function () {
        const ops = new Dispatch({
            STOP: { op: 0 },
            ADD: { op: 1 },
            MUL: { op: 2 },
            PUSH4: { op: 3, size: 4 },
            NULL: { op: 0xff },
        }, 'NULL');

        expect([...ops.decode(arrayify('0x0102030a0b0c0d00'), 0)]).toEqual([
            { mnemonic: 'ADD', op: 1, pc: 0, nextpc: 1 },
            { mnemonic: 'MUL', op: 2, pc: 1, nextpc: 2 },
            { mnemonic: 'PUSH4', op: 3, pc: 2, nextpc: 7, data: new Uint8Array([10, 11, 12, 13]) },
            { mnemonic: 'STOP', op: 0, pc: 7, nextpc: 8 },
        ]);
    });

    it('should return no opcodes past end buffer', function () {
        const ops = new Dispatch({ NULL: { op: 0 } }, 'NULL');
        expect([...ops.decode(new Uint8Array(), 0)]).to.be.empty;
        expect([...ops.decode(new Uint8Array(), 5)]).to.be.empty;
        expect([...ops.decode(new Uint8Array([1, 2, 3, 1, 2]), 5)]).to.be.empty;
        expect([...ops.decode(new Uint8Array([1, 2, 3, 1, 2]), 9)]).to.be.empty;
    });

    it('should decode starting at a non-zero `pc`', function () {
        const ops = new Dispatch({
            ADD: { op: 0x01 },
            SUB: { op: 0x03 },
            PUSH1: { op: 0x60, size: 1 },
            NULL: { op: 0xff },
        }, 'NULL');
        const bytecode = arrayify('0x6003600501');

        expect([...ops.decode(bytecode, 0)]).toEqual([
            { mnemonic: 'PUSH1', op: 0x60, pc: 0, nextpc: 2, data: new Uint8Array([3]) },
            { mnemonic: 'PUSH1', op: 0x60, pc: 2, nextpc: 4, data: new Uint8Array([5]) },
            { mnemonic: 'ADD', op: 0x01, pc: 4, nextpc: 5 },
        ]);
        expect([...ops.decode(bytecode, 1)]).toEqual([
            { mnemonic: 'SUB', op: 0x03, pc: 1, nextpc: 2 },
            { mnemonic: 'PUSH1', op: 0x60, pc: 2, nextpc: 4, data: new Uint8Array([5]) },
            { mnemonic: 'ADD', op: 0x01, pc: 4, nextpc: 5 },
        ]);
        expect([...ops.decode(bytecode, 2)]).toEqual([
            { mnemonic: 'PUSH1', op: 0x60, pc: 2, nextpc: 4, data: new Uint8Array([5]) },
            { mnemonic: 'ADD', op: 0x01, pc: 4, nextpc: 5 },
        ]);
    });

    it('should decode to all `INVALID` opcodes', function () {
        const ops = new Dispatch({ INVALID: { op: 0x00 } }, 'INVALID');
        expect([...ops.decode(arrayify('0c0d0e0ffc'), 0)]).toEqual([
            { mnemonic: 'INVALID', op: 0x0c, pc: 0, nextpc: 1 },
            { mnemonic: 'INVALID', op: 0x0d, pc: 1, nextpc: 2 },
            { mnemonic: 'INVALID', op: 0x0e, pc: 2, nextpc: 3 },
            { mnemonic: 'INVALID', op: 0x0f, pc: 3, nextpc: 4 },
            { mnemonic: 'INVALID', op: 0xfc, pc: 4, nextpc: 5 },
        ]);
    });

    it('should decode `PUSHn` opcodes', function () {
        const d = new Dispatch({
            ADD: { op: 0x01 },
            SUB: { op: 0x03 },
            PUSH4: { op: 0x05, size: 4 },
            JUMPDEST: { op: 0x0a },
            PUSH1: { op: 0x60, size: 1 },
            NULL: { op: 0xff },
        }, 'NULL');

        expect([...d.decode(arrayify('0x6003600501'), 0)]).toEqual([
            { mnemonic: 'PUSH1', op: 0x60, pc: 0, nextpc: 2, data: new Uint8Array([3]) },
            { mnemonic: 'PUSH1', op: 0x60, pc: 2, nextpc: 4, data: new Uint8Array([5]) },
            { mnemonic: 'ADD', op: 0x01, pc: 4, nextpc: 5 },
        ]);

        expect([...d.decode(new Uint8Array([
            d.ops.PUSH4,
            ...[1, 2, 3, 4],
            d.ops.JUMPDEST,
            d.ops.PUSH4,
            ...[5, 6, 7, 8],
            d.ops.JUMPDEST,
            d.ops.ADD,
        ]), 0)]).to.be.deep.equal([
            { mnemonic: 'PUSH4', op: 0x05, pc: 0, nextpc: 5, data: new Uint8Array([1, 2, 3, 4]) },
            { mnemonic: 'JUMPDEST', op: 0x0a, pc: 5, nextpc: 6 },
            { mnemonic: 'PUSH4', op: 0x05, pc: 6, nextpc: 11, data: new Uint8Array([5, 6, 7, 8]) },
            { mnemonic: 'JUMPDEST', op: 0x0a, pc: 11, nextpc: 12 },
            { mnemonic: 'ADD', op: 0x01, pc: 12, nextpc: 13 },
        ]);
    });

    it('should fail when `PUSH`n does not have enough data to decode', function () {
        const def = {
            STOP: { op: 0x00 },
            ADD: { op: 0x01 },
            PUSH4: { op: 0x05, size: 4 },
            PUSH20: { op: 0x73, size: 20 },
            PUSH32: { op: 0x7f, size: 32 },
            NULL: { op: 0xff },
        };
        const ops = new Dispatch(def, 'NULL');
        expect(() => ops.decode(new Uint8Array([def.PUSH32.op]), 0).next()).toThrow(
            'Trying to get `32` bytes but got only `0` while decoding `00: <7f>PUSH32 0x` before reaching the end of bytecode'
        );

        const opcodes = ops.decode(new Uint8Array([def.ADD.op, def.STOP.op, def.PUSH20.op, 1, 2, 3]), 0);
        expect(opcodes.next().value).toEqual({ mnemonic: 'ADD', op: 0x01, pc: 0, nextpc: 1 });
        expect(opcodes.next().value).toEqual({ mnemonic: 'STOP', op: 0x00, pc: 1, nextpc: 2 });
        expect(() => opcodes.next()).toThrow(
            'Trying to get `20` bytes but got only `3` while decoding `02: <73>PUSH20 0x010203` before reaching the end of bytecode'
        );
    });

    describe('formatOpcode', () => {
        it.each([
            [2, 1, 'ADD', undefined, '02: <01>ADD'],
            [1, 0x63, 'PUSH4', new Uint8Array([1, 2, 3, 4]), '01: <63>PUSH4 0x01020304'],
            [0, 0xb0, 'INVALID', undefined, '00: <b0>INVALID'],
        ])('should `format` opcodes', (pc, op, mnemonic, data, expected) => {
            const opstr = formatOpcode({ pc, op, mnemonic, ...data === undefined ? {} : { data } });
            expect(opstr).toBe(expected);
        });
    });

    describe.skip('decode PUSHn selectors', function () {
        const ops = new Dispatch({
            // STOP: 0x00,
            // ADD: 0x01,
            // MUL: 0x02,
            // SUB: 0x03,
            // PUSH4: { opcode: 0x05, size: 4 },
            // JUMPDEST: 0x0a,
            // PUSH1: { opcode: 0x60, size: 1 },
            // PUSH3: { opcode: 0x62, size: 3 },
            // PUSH20: { opcode: 0x73, size: 20 },
            // PUSH32: { opcode: 0x7f, size: 32 },
            // STATICCALL: 0xfa,
            // SELFDESTRUCT: 0xff,
        })
        // const a = { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);

        it.skip('should find method selector decoded as `PUSH3`', ctx => {
            // "00e4778a": "addAccessoryIdMapping(address,uint64)",
            const src = `contract Test {
                function addAccessoryIdMapping(address, uint64) public pure returns (uint) {
                    return 1;
                }
            }`;
            const { bytecode } = parseMetadata(arrayify(compile(src, '0.7.6', ctx).bytecode));
            const opcodes = [...ops.decode(bytecode, 0)];

            const push3 = opcodes.find(o => o.mnemonic === 'PUSH3' && o.hexData() === 'e4778a');
            expect(push3).not.toBeUndefined();
        });

        it.skip('should find method selector encoded as `PUSH1`', ctx => {
            // "000000c7": "withdrawByAdmin_Unau(uint256[])",
            const src = `contract Test {
                function withdrawByAdmin_Unau(uint256[] calldata) public pure returns (uint) {
                    return 1;
                }
            }`;
            const { bytecode } = parseMetadata(arrayify(compile(src, '0.7.6', ctx).bytecode));
            const opcodes = [...ops.decode(bytecode, 0)];

            const push1 = opcodes.find(o => o.mnemonic === 'PUSH1' && o.hexData() === 'c7');
            expect(push1).not.toBeUndefined();
        });

        it('should find `PUSH4` method selector to invoke external contract', ctx => {
            const sig = 'balanceOf(uint256)';
            const src = `interface IERC20 {
                function ${sig} external view returns (uint256);
            }
            contract Test {
                fallback() external payable {
                    IERC20 addr = IERC20 (0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359);
                    addr.balanceOf(7);
                }
            }`;
            const { bytecode } = parseMetadata(arrayify(compile(src, '0.7.6', ctx).bytecode));
            console.log(bytecode);
            const opcodes = [...ops.decode(bytecode, 0)];

            // const selector = fnselector(sig);
            const selector = '';
            const push4 = opcodes.find(o => o.mnemonic === 'PUSH4' && o.hexData() === selector);
            expect(push4).to.be.not.undefined;
        });
    });

    describe('decode empty contracts should have the same bytecode', function () {
        const bytecodes = new Set<string>();

        it.for([
            ['with no functions', `contract Test {
                }`],
            ['with `internal` unused function', `contract Test {
                    function get() internal pure returns (uint256) {
                        return 5;
                    }
                }`],
            ['with `internal` unused function emitting an event', `contract Test {
                    event Transfer(uint256, address);
                    function get() internal {
                        emit Transfer(3, address(this));
                    }
                }`],
            ['with a private variable and no usages', `contract Test {
                    uint256 private value;
                }`],
            ['with a private variable and unreachable usages', `contract Test {
                    uint256 private value;
                    function setValue(uint256 newValue) internal {
                        value = newValue;
                    }
                }`],
        ])('%s', ([, src], ctx) => {
            const ops = new Dispatch({
                MSTORE: { op: 0x52 },
                PUSH1: { op: 0x60, size: 1 },
                DUP1: { op: 0x80 },
                REVERT: { op: 0xfd },
                INVALID: { op: 0xfe },
            }, 'INVALID');

            const { bytecode } = parseMetadata(arrayify(compile(src, '0.7.6', ctx).bytecode));
            bytecodes.add(hexlify(bytecode));
            expect(bytecodes).to.have.length(1);

            expect([...ops.decode(bytecode, 0)]).toEqual([
                { mnemonic: 'PUSH1', op: 0x60, pc: 0, nextpc: 2, data: new Uint8Array([0x80]) },
                { mnemonic: 'PUSH1', op: 0x60, pc: 2, nextpc: 4, data: new Uint8Array([0x40]) },
                { mnemonic: 'MSTORE', op: 0x52, pc: 4, nextpc: 5 },
                { mnemonic: 'PUSH1', op: 0x60, pc: 5, nextpc: 7, data: new Uint8Array([0x00]) },
                { mnemonic: 'DUP1', op: 0x80, pc: 7, nextpc: 8 },
                { mnemonic: 'REVERT', op: 0xfd, pc: 8, nextpc: 9 },
                { mnemonic: 'INVALID', op: 0xfe, pc: 9, nextpc: 10 },
            ]);
        });
    });
});