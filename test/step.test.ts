import { expect } from 'chai';

import { Opcode, sol, State, STEP } from 'sevm';
import { Val, type Expr, Local, Locali, type Inst, Block, Invalid } from 'sevm/ast';
import { $exprs } from './$exprs';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
const sizes = [...Array(16).keys()].map(i => i + 1);

describe('::step', function () {

    describe('Opcode', function () {
        it('should convert `data` to hex format', function () {
            const data = Buffer.from([1, 2, 3, 4, 12, 13, 14, 15, 254, 255, 0]);
            expect(new Opcode(0, 0, '', data).hexData()).to.be.equal('010203040c0d0e0ffeff00');
        });

        it('should format opcodes', function () {
            expect(new Opcode(2, 0x1, 'ADD', null).format())
                .to.be.equal('@2:ADD(0x1)');
            expect(new Opcode(1, 0x63, 'PUSH4', Buffer.from([1, 2, 3, 4])).format())
                .to.be.equal('@1:PUSH4(0x63) 0x01020304 (16909060)');
            expect(new Opcode(0, 0xb0, 'INVALID', null).format())
                .to.be.equal('@0:INVALID(0xb0)');
        });
    });

    describe('support methods', function () {
        it('should retrieve halting insts', function () {
            const haltingSteps = STEP().haltingSteps();
            expect(haltingSteps).to.be.deep.equal(
                ['STOP', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT'] satisfies typeof haltingSteps
            );
        });

        it('should retrieve `opcodes`', function () {
            const opcodes = STEP().opcodes();
            expect(opcodes.STOP).to.be.equal(0);
            expect(opcodes.ADD).to.be.equal(1);
            expect(opcodes.PUSH32).to.be.equal(0x60 + 32 - 1);
            expect(opcodes.SELFDESTRUCT).to.be.equal(255);
        });

        it('should find decoder by opcode `number`', function () {
            const step = STEP();
            expect(step[0]).to.be.deep.equal([0, true, 'STOP']);
            expect(step[1]).to.be.deep.equal([0, false, 'ADD']);
            expect(step[0x60 + 32 - 1]).to.be.deep.equal([32, false, 'PUSH32']);
            expect(step[0xfc]).to.be.deep.equal([0, true, 'UNDEF']);
            expect(step[0xfd]).to.be.deep.equal([0, true, 'REVERT']);
            expect(step[0xfe]).to.be.deep.equal([0, true, 'INVALID']);
            expect(step[0xff]).to.be.deep.equal([0, true, 'SELFDESTRUCT']);
        });
    });

    describe('decode', function () {
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
            const { opcodes, jumpdests } = decodeArray(OPCODES.ADDRESS, OPCODES.ADDRESS, OPCODES.JUMPDEST, OPCODES.ADD);

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

    });

    describe('PUSHES', function () {
        it('should PUSH value onto stack', function () {
            const state = new State<never, Expr>();
            STEP().PUSH1(state, new Opcode(0, 1, 'PUSH1', Buffer.from([1])));
            expect(state.stack.values).to.deep.equal([new Val(1n, true)]);
        });
    });

    describe('DUPS', function () {
        sizes.forEach(size => {
            it(`should DUP #${size - 1} element on the stack`, function () {
                const state = new State<never, Expr>();
                state.stack.push(new Val(2n));

                const ignored = [];
                for (let i = 1; i < size; i++) {
                    ignored.push(new Val(1n));
                    state.stack.push(new Val(1n));
                }

                STEP()[`DUP${size as Size}`](state);

                const local = new Local(0, new Val(2n));
                expect(state.nlocals).to.be.equal(1);
                expect(state.stmts).to.be.deep.equal([new Locali(local)]);
                expect(state.stack.values).to.deep.equal([local, ...ignored, local]);
            });

            it(`should throw when #${size} element is not present on the stack`, function () {
                const state = new State<never, Expr>();

                for (let i = 1; i < size; i++) {
                    state.stack.push(new Val(1n));
                }

                expect(() => STEP()[`DUP${size as Size}`](state)).to.throw(
                    'Invalid duplication operation'
                );
            });
        });
    });

    describe('SWAPS', function () {
        sizes.forEach(size => {
            it(`should SWAP #${size} element on the stack`, function () {
                const state = new State<never, Expr>();
                state.stack.push(new Val(2n));

                const ignored = [];
                for (let i = 1; i < size; i++) {
                    ignored.push(new Val(1n));
                    state.stack.push(new Val(1n));
                }

                state.stack.push(new Val(3n));

                STEP()[`SWAP${size as Size}`](state);

                expect(state.stack.values).to.deep.equal([
                    new Val(2n),
                    ...ignored,
                    new Val(3n),
                ]);
            });

            it(`should throw when #${size + 1} elem is not present on the stack`, function () {
                const state = new State<never, Expr>();

                for (let i = 1; i <= size; i++) {
                    state.stack.push(new Val(1n));
                }

                expect(() => STEP()[`SWAP${size as Size}`](state)).to.throw(
                    'Position not found for swap operation'
                );
            });
        });
    });

    for (const [name, exprs] of Object.entries($exprs)) {
        describe(name.toUpperCase(), function () {
            exprs.forEach(({ insts, expr, str }) => {
                it(`should \`STEP\` \`[${insts.join('|')}]\` into \`${str}\``, function () {
                    const state = new State<never, Expr>();
                    for (const inst of insts) {
                        if (typeof inst === 'bigint') {
                            state.stack.push(new Val(inst));
                        } else {
                            STEP()[inst](state);
                        }
                    }

                    expect(state.stack.values).to.be.deep.equal([expr]);
                });
            });
        });
    }

    describe('MEMORY', function () {
        it('should MLOAD value onto stack', function () {
            const state = new State<Inst, Expr>();

            state.memory[4] = new Val(1n);
            state.stack.push(new Val(4n));
            STEP().MLOAD(state);

            expect(state.stack.values).to.be.deep.equal([new Val(1n)]);
        });

        it('should MSTORE value into memory', function () {
            const state = new State<Inst, Expr>();

            state.stack.push(Block.coinbase);
            state.stack.push(new Val(4n));
            STEP().MSTORE(state);

            expect(state.memory).to.be.deep.equal({ '4': Block.coinbase });
        });
    });

    describe('SYSTEM', function () {
        it('should halt when `INVALID` step', function () {
            const state = new State<Inst, Expr>();
            STEP().INVALID(state, new Opcode(0, 1, 'INVALID', null));
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Invalid(1)]);
            expect(sol`${state.stmts[0]}`).to.be.equal("revert('Invalid instruction (0x1)');");
        });
    });

});
