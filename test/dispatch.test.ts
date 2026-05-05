import { describe, it, expect } from 'vitest';

import { Opcode, Dispatch } from '../src/dispatch.ts';
import { parseMetadata } from '../src/metadata.ts';

import { compile } from './utils/solc.ts';
// import { fnselector } from './utils/selector.ts';
// const solc = compile;

describe('::decode', function () {
    describe('Opcode', () => {
        const ops = Dispatch.new('nodef').build({
            STOP: 0,
            ADD: 1,
            MUL: 2,
            PUSH4: { opcode: 3, size: 4 },
        });

        it.each([
            'STOP',
            'ADD',
            'MUL',
        ] as const)('should convert unary opcode $0 nulled-`data` to hex format', function (mnemonic) {
            expect(new ops.Opcode(0, mnemonic).hexData()).toBeUndefined();
        });

        it.each([
            [0, 'ADD' as const],
            [3, 'MUL' as const],
        ])('should get `nextpc` for a unary opcode $1', (pc, mnemonic) => {
            expect(new ops.Opcode(pc, mnemonic).nextpc).to.be.equal(pc + 1);
        });

        it.each([
            [0, 'ADD' as const, 5],
            [3, 'MUL' as const, 8],
        ])('should get `nextpc` for opcode $1 with data', (pc, mnemonic, nextpc) => {
            expect(new ops.Opcode(pc, mnemonic, new Uint8Array([1, 2, 3, 4])).nextpc).to.be.equal(nextpc);
        });

        it('should convert `data` to hex format', () => {
            const data = new Uint8Array([1, 2, 3, 4, 12, 13, 14, 15, 254, 255, 0]);
            expect(new ops.Opcode(0, 'MUL', data).hexData()).to.be.equal('010203040c0d0e0ffeff00');
        });

        it.each([
            [2, 'ADD' as const, undefined, 'ADD(0x1)@2'],
            [1, 'PUSH4' as const, new Uint8Array([1, 2, 3, 4]), 'PUSH4(0x63)@1 0x01020304 (16909060)'],
            [0, 'INVALID' as const, undefined, 'INVALID(0xb0)@0'],
        ])('should `format` opcodes', (pc, mnemonic, data, expected) => {
            const ops = Dispatch.new('nodef').build({
                STOP: 0,
                ADD: 1,
                MUL: 2,
                PUSH4: { opcode: 0x63, size: 4 },
                INVALID: 0xb0,
            });
            expect(new ops.Opcode(pc, mnemonic, data).format()).toBe(expected);
        });

        it('should `format` opcodes with not `includeDataAsNumeric`', function () {
            expect(new ops.Opcode(2, 'ADD').format(false))
                .to.be.equal('ADD(0x1)@2');
            expect(new ops.Opcode(1, 'PUSH4', Buffer.from([1, 2, 3, 4])).format(false))
                .to.be.equal('PUSH4(0x3)@1 0x01020304');
        });
    });

    describe('Opcodes', function () {
        describe('build', () => {
            it('should `build` a table with unary opcodes', function () {
                const ops = Dispatch.new('nodef').build({
                    A: 0,
                    B: 1,
                });
                expect(ops.opcodes).toStrictEqual({ 'A': 0, 'B': 1 });
            });

            it('should `build` an opcodes table based on another instance', function () {
                const ops1 = Dispatch.new('nodef').build({
                    A: 0,
                    B: 1,
                });
                const ops2 = ops1.build({
                    C: 2,
                    D: 3,
                });
                expect(ops2).not.toBe(ops1);
                expect(ops1.opcodes).toStrictEqual({ 'A': 0, 'B': 1 });
                expect(ops2.opcodes).toStrictEqual({ 'A': 0, 'B': 1, 'C': 2, 'D': 3 });
            });
        });

        describe('decode', function () {
            it('should `decode` unary opcodes', function () {
                const ops = new Dispatch({
                    STOP: { op: 0 },
                    ADD: { op: 1 },
                    MUL: { op: 2 },
                    SUB: { op: 3 },
                });

                expect([...ops.decode('0x00010203020300')])
                    .to.be.deep.equal([
                        new Opcode(0, 0, 'STOP'),
                        new Opcode(1, 1, 'ADD'),
                        new Opcode(2, 2, 'MUL'),
                        new Opcode(3, 3, 'SUB'),
                        new Opcode(4, 2, 'MUL'),
                        new Opcode(5, 3, 'SUB'),
                        new Opcode(6, 0, 'STOP'),
                    ]);
            });

            it('should `decode` unary opcodes 2', function () {
                const ops = Dispatch.new('nodef').build({
                    STOP: 0,
                    ADD: 1,
                    MUL: 2,
                    PUSH4: { opcode: 3, size: 4 },
                });

                expect([...ops.decode('0x0102030a0b0c0d00')].map(op => ({ ...op, nextpc: op.nextpc, str: `${op}` }))).toEqual([
                    { mnemonic: 'ADD', opcode: 1, pc: 0, nextpc: 1, str: '00: <01>ADD' },
                    { mnemonic: 'MUL', opcode: 2, pc: 1, nextpc: 2, str: '01: <02>MUL' },
                    { mnemonic: 'PUSH4', opcode: 3, pc: 2, data: new Uint8Array([10, 11, 12, 13]), nextpc: 7, str: '02: <03>PUSH4 (168496141)' },
                    { mnemonic: 'STOP', opcode: 0, pc: 7, nextpc: 8, str: '07: <00>STOP' },
                ]);

                for (const o of ops.decode('0x0102')) {
                    if (o.mnemonic === 'PUSH4') {
                        console.log(o.data);
                        console.log(o.hexData());
                    }
                    // console.log(o.data);

                    // console.log(o.d());
                    // if (o.opcode === ops.opcodes.PUSH4) {
                    //     // TODO
                    //     console.log(o.d());
                    //     console.log(o.hexData()!.length);
                    // }

                    // if (o.is('PUSH4')) {
                    //     console.log(o.mnemonic);
                    //     // console.log(o.d());
                    // }
                }
            });

            const ops = Dispatch.new('NODEF').build({
                STOP: 0x00,
                ADD: 0x01,
                MUL: 0x02,
                SUB: 0x03,
                PUSH4: { opcode: 0x05, size: 4 },
                JUMPDEST: 0x0a,
                PUSH1: { opcode: 0x60, size: 1 },
                PUSH3: { opcode: 0x62, size: 3 },
                PUSH20: { opcode: 0x73, size: 20 },
                PUSH32: { opcode: 0x7f, size: 32 },
                STATICCALL: 0xfa,
                SELFDESTRUCT: 0xff,
            })
            const step = ops;
            const OPCODES = ops.opcodes;

            it('should `decode` `PUSH`n opcodes', function () {
                expect([...step.decode([
                    OPCODES.PUSH4,
                    ...[1, 2, 3, 4],
                    OPCODES.JUMPDEST,
                    OPCODES.PUSH4,
                    ...[5, 6, 7, 8],
                    OPCODES.JUMPDEST,
                    OPCODES.ADD
                ])]).to.be.deep.equal([
                    new ops.Opcode(0, 'PUSH4', Buffer.from([1, 2, 3, 4])),
                    new ops.Opcode(5, 'JUMPDEST'),
                    new ops.Opcode(6, 'PUSH4', Buffer.from([5, 6, 7, 8])),
                    new ops.Opcode(11, 'JUMPDEST'),
                    new ops.Opcode(12, 'ADD'),
                ]);
            });

            it('should fail when `PUSH`n does not have enough data to decode', function () {
                expect(() => step.decode([OPCODES.PUSH32]).next()).to.throw(
                    'Trying to get `32` bytes but got only `0` while decoding `PUSH32(0x7f)@0 0x` before reaching the end of bytecode'
                );

                const opcodes = step.decode([OPCODES.ADD, OPCODES.STOP, OPCODES.PUSH20, 1, 2, 3]);
                expect(opcodes.next().value)
                    .to.be.deep.equal(new ops.Opcode(0, 'ADD'));
                expect(opcodes.next().value)
                    .to.be.deep.equal(new ops.Opcode(1, 'STOP'));
                expect(() => opcodes.next()).to.throw(
                    'Trying to get `20` bytes but got only `3` while decoding `PUSH20(0x73)@2 0x010203` before reaching the end of bytecode'
                );
            });

            it('should `decode` with `INVALID` opcodes', function () {
                expect([...step.decode([0xb0, OPCODES.ADD, 0xb1])]).to.be.deep.equal([
                    new ops.Opcode(0, 'NODEF'),
                    new ops.Opcode(1, 'ADD'),
                    new ops.Opcode(2, 'NODEF'),
                ]);
            });

            it('should `decode` `PUSHn`', function () {
                expect([...step.decode('0x6003600501')]).to.be.deep.equal([
                    new ops.Opcode(0, 'PUSH1', Buffer.from([3])),
                    new ops.Opcode(2, 'PUSH1', Buffer.from([5])),
                    new ops.Opcode(4, 'ADD'),
                ]);
            });

            it('should `decode` starting at a non-zero `pc`', function () {
                const bytecode = '0x6003600501';

                expect([...step.decode(bytecode, 2)]).to.be.deep.equal([
                    new ops.Opcode(2, 'PUSH1', Buffer.from([5])),
                    new ops.Opcode(4, 'ADD'),
                ]);

                expect([...step.decode(bytecode, 1)]).to.be.deep.equal([
                    new ops.Opcode(1, 'SUB'),
                    new ops.Opcode(2, 'PUSH1', Buffer.from([5])),
                    new ops.Opcode(4, 'ADD'),
                ]);
            });

            it('should `decode` all `INVALID` opcodes', function () {
                expect([...step.decode('0c0d0e0ffc')].map(op => op.mnemonic))
                    .to.be.deep.equal(Array(5).fill('NULL'));
            });

            ['', '0x', '0X'].forEach(p => describe(`arrayify and decode with prefix \`${p}\``, function () {
                it(`should \`decode\` empty buffer`, function () {
                    expect([...step.decode(p + '')]).to.be.empty;
                });

                it(`should \`decode\` opcodes and accept lower and uppercase hex digits`, function () {
                    expect([...step.decode(p + '00010203FAff')].map(op => op.mnemonic)).to.be.deep.equal(
                        ['STOP', 'ADD', 'MUL', 'SUB', 'STATICCALL', 'SELFDESTRUCT']
                    );
                });

                it(`should throw when input is not even`, function () {
                    expect(() => step.decode(p + 'a').next()).to.throw(
                        `Unable to decode, input should have even length, but got length '${p.length + 1}'`
                    );
                });

                it(`should throw when input has an invalid hex byte`, function () {
                    expect(() => step.decode(p + '010203xx').next()).to.throw(
                        `Unable to decode, invalid hex byte 'xx' found at position '${p.length + 7}'`
                    );
                    expect(() => step.decode(p + '010203ax').next()).to.throw(
                        `Unable to decode, invalid hex byte 'ax' found at position '${p.length + 7}'`
                    );
                });
            }));

            // const a = { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);

            it.skip('should find method selector decoded as `PUSH3`', (ctx) => {
                // "00e4778a": "addAccessoryIdMapping(address,uint64)",
                const src = `contract Test {
                function addAccessoryIdMapping(address, uint64) public pure returns (uint) {
                    return 1;
                }
            }`;
                const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
                const opcodes = [...ops.decode(bytecode)];

                const push3 = opcodes.find(o => o.mnemonic === 'PUSH3' && o.hexData() === 'e4778a');
                expect(push3).not.toBeUndefined();
            });

            it.skip('should find method selector decoded as `PUSH1`', (ctx) => {
                // "000000c7": "withdrawByAdmin_Unau(uint256[])",
                const src = `contract Test {
                function withdrawByAdmin_Unau(uint256[] calldata) public pure returns (uint) {
                    return 1;
                }
            }`;
                const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
                const opcodes = [...ops.decode(bytecode)];

                const push1 = opcodes.find(o => o.mnemonic === 'PUSH1' && o.hexData() === 'c7');
                expect(push1).not.toBeUndefined();
            });

            it.skip('should find `PUSH4` method selector to invoke external contract', (ctx) => {
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
                const opcodes = [...ops.decode(compile(src, '0.7.6', ctx).bytecode)];

                // const selector = fnselector(sig);
                const selector = '';
                const push4 = opcodes.find(o => o.mnemonic === 'PUSH4' && o.hexData() === selector);
                expect(push4).to.be.not.undefined;
            });

            describe.skip('decode empty contracts should have the same bytecode', function () {
                const bytecodes = new Set<string>();

                ([
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
                ] satisfies [string, string][]).forEach(([title, src]) => {
                    it(title, (ctx) => {
                        const { bytecode } = parseMetadata(compile(src, '0.7.6', ctx).bytecode);
                        bytecodes.add(Buffer.from(bytecode).toString('hex'));
                        expect(bytecodes).to.have.length(1);

                        expect([...ops.decode(bytecode)].map(o => o.mnemonic))
                            .to.be.deep.equal([
                                'PUSH1', 'PUSH1', 'MSTORE', 'PUSH1', 'DUP1', 'REVERT', 'INVALID',
                            ]);
                    });
                });
            });
        });
    });
});