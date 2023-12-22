import { expect } from 'chai';

import { Opcode, type Operand, sol, Stack, State, STEP } from 'sevm';
import { Val, type Expr, Local, Locali, type Inst, Block, Invalid, MStore, Jump, Branch, Jumpi, Log, type IEvents } from 'sevm/ast';
import { Add, Create, Info, MLoad, Return, SelfDestruct, Sha3, Stop } from 'sevm/ast';
import { $exprs } from './$exprs';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
const sizes = [...Array(16).keys()].map(i => i + 1);

describe('::step', function () {

    describe('Opcode', function () {
        it('should convert null-`data` to hex format', function () {
            expect(new Opcode(0, 0, '', null).hexData()).to.be.equal(undefined);
        });

        it('should convert `data` to hex format', function () {
            const data = Buffer.from([1, 2, 3, 4, 12, 13, 14, 15, 254, 255, 0]);
            expect(new Opcode(0, 0, '', data).hexData()).to.be.equal('010203040c0d0e0ffeff00');
        });

        it('should `format` opcodes', function () {
            expect(new Opcode(2, 0x1, 'ADD', null).format())
                .to.be.equal('ADD(0x1)@2');
            expect(new Opcode(1, 0x63, 'PUSH4', Buffer.from([1, 2, 3, 4])).format())
                .to.be.equal('PUSH4(0x63)@1 0x01020304 (16909060)');
            expect(new Opcode(0, 0xb0, 'INVALID', null).format())
                .to.be.equal('INVALID(0xb0)@0');
        });
    });

    describe('support methods', function () {
        it('should retrieve `haltingInsts`', function () {
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

        it('should find decoder table by opcode number', function () {
            const step = STEP();
            expect(step[0]).to.be.deep.equal([0, true, 'STOP']);
            expect(step[1]).to.be.deep.equal([0, false, 'ADD']);
            expect(step[0x60 + 32 - 1]).to.be.deep.equal([32, false, 'PUSH32']);
            expect(step[0xfc]).to.be.deep.equal([0, true, 'UNDEF']);
            expect(step[0xfd]).to.be.deep.equal([0, true, 'REVERT']);
            expect(step[0xfe]).to.be.deep.equal([0, true, 'INVALID']);
            expect(step[0xff]).to.be.deep.equal([0, true, 'SELFDESTRUCT']);
        });

        it('should override `NUMBER` step', function () {
            const stack = new Stack<Expr>();
            let numberWasCalled = false;
            const step = Object.setPrototypeOf({
                NUMBER(state: Operand<Expr>) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    super.NUMBER(state);
                    numberWasCalled = true;
                }
            }, STEP());
            step.NUMBER({ stack });
            expect(stack.top).to.be.deep.equal(Block.number);
            expect(numberWasCalled, '`NUMBER` step was not overriden').to.be.true;
        });
    });

    describe('decode', function () {
        const step = STEP();
        const OPCODES = step.opcodes();
        const decode = step.decode.bind(step);

        const decodeArray = (...opcodes: number[]) => decode(Buffer.from(opcodes).toString('hex'));

        it('should `decode` unary opcodes', function () {
            const opcodes = decodeArray(OPCODES.ADDRESS, OPCODES.ADDRESS, OPCODES.JUMPDEST, OPCODES.ADD);

            expect(opcodes).to.be.deep.equal([
                new Opcode(0, OPCODES.ADDRESS, 'ADDRESS', null),
                new Opcode(1, OPCODES.ADDRESS, 'ADDRESS', null),
                new Opcode(2, OPCODES.JUMPDEST, 'JUMPDEST', null),
                new Opcode(3, OPCODES.ADD, 'ADD', null),
            ]);
        });

        it('should `decode` `PUSH`n opcodes', function () {
            const opcodes = decodeArray(
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
        });

        it('should not fail `PUSH`n does not have enough data', function () {
            expect(decodeArray(OPCODES.PUSH32)).to.be.deep.equal(
                [new Opcode(0, OPCODES.PUSH32, 'PUSH32', Buffer.from([]))]
            );
            expect(decodeArray(OPCODES.PUSH32, 1)).to.be.deep.equal(
                [new Opcode(0, OPCODES.PUSH32, 'PUSH32', Buffer.from([1]))]
            );
        });

        it('should `decode` with `INVALID` opcodes', function () {
            const opcodes = decodeArray(0xb0, OPCODES.ADD, 0xb1);

            expect(opcodes).to.be.deep.equal([
                new Opcode(0, 0xb0, 'UNDEF', null),
                new Opcode(1, OPCODES.ADD, 'ADD', null),
                new Opcode(2, 0xb1, 'UNDEF', null),
            ]);
        });

        it('should `decode` example from hex string', function () {
            const opcodes = decode('0x6003600501');

            expect(opcodes).to.be.deep.equal([
                new Opcode(0, OPCODES.PUSH1, 'PUSH1', Buffer.from([3])),
                new Opcode(2, OPCODES.PUSH1, 'PUSH1', Buffer.from([5])),
                new Opcode(4, OPCODES.ADD, 'ADD', null),
            ]);
        });

        it('should `decode` all `INVALID` opcodes', function () {
            const opcodes = decode('0c0d0e0ffc');
            expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal(Array(5).fill('UNDEF'));
        });

        ['', '0x', '0X'].forEach(p => describe(`decode with prefix \`${p}\``, function () {
            it(`should \`decode\` empty buffer`, function () {
                const opcodes = decode(p + '');
                expect(opcodes).to.be.empty;
            });

            it(`should \`decode\` opcodes`, function () {
                const opcodes = decode(p + '00010203');
                expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal(['STOP', 'ADD', 'MUL', 'SUB']);
            });

            it(`should throw when input is not even`, function () {
                expect(() => decode(p + '1')).to.throw('input should have even length');
            });

            it(`should throw when input has an invalid number`, function () {
                expect(() => decode(p + 'gg')).to.throw(
                    `invalid value found at ${p.length}`
                );
            });
        }));

    });

    describe('PUSHES', function () {
        it('should PUSH value onto stack', function () {
            const stack = new Stack<Expr>();
            STEP().PUSH1({ stack }, new Opcode(0, 1, 'PUSH1', Buffer.from([1])));
            expect(stack.values).to.deep.equal([new Val(1n, true)]);
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
                const stack = new Stack<Expr>();
                stack.push(new Val(2n));

                const ignored = [];
                for (let i = 1; i < size; i++) {
                    ignored.push(new Val(1n));
                    stack.push(new Val(1n));
                }

                stack.push(new Val(3n));

                STEP()[`SWAP${size as Size}`]({ stack });

                expect(stack.values).to.deep.equal([
                    new Val(2n),
                    ...ignored,
                    new Val(3n),
                ]);
            });

            it(`should throw when #${size + 1} elem is not present on the stack`, function () {
                const stack = new Stack<Expr>();

                for (let i = 1; i <= size; i++) {
                    stack.push(new Val(1n));
                }

                expect(() => STEP()[`SWAP${size as Size}`]({ stack })).to.throw(
                    'Position not found for swap operation'
                );
            });
        });
    });

    for (const [name, exprs] of Object.entries($exprs)) {
        describe(name.toUpperCase(), function () {
            exprs.forEach(({ insts, expr, str }) => {
                it(`should \`STEP\` \`[${insts.join('|')}]\` into \`${str}\``, function () {
                    const stack = new Stack<Expr>();
                    for (const inst of insts) {
                        if (typeof inst === 'bigint') {
                            stack.push(new Val(inst));
                        } else {
                            STEP()[inst]({ stack });
                        }
                    }

                    expect(stack.values).to.be.deep.equal([expr]);
                });
            });
        });
    }

    describe('MEMORY', function () {
        it('should `MLOAD` value onto stack', function () {
            const state = new State<Inst, Expr>();

            state.memory[4] = new Val(1n);
            state.stack.push(new Val(4n));
            STEP().MLOAD(state);

            expect(state.stack.values).to.be.deep.equal([new Val(1n)]);
        });

        it('should `MSTORE` value into memory', function () {
            const state = new State<Inst, Expr>();

            state.stack.push(Block.coinbase);
            state.stack.push(new Val(4n));
            STEP().MSTORE(state);

            expect(state.memory).to.be.deep.equal({ '4': Block.coinbase });
            expect(state.stmts).to.be.deep.equal([new MStore(new Val(4n), Block.coinbase)]);
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

        it('should exec `SHA3`', function () {
            const state = new State<never, Expr>();
            state.stack.push(new Val(4n));
            state.stack.push(new Val(0x10n));
            STEP().SHA3(state);
            expect(state.halted).to.be.false;
            expect(state.stack.values).to.be.deep.equal([
                new Sha3(new Val(0x10n), new Val(4n), [new MLoad(new Val(0x10n))]),
            ]);
            expect(sol`${state.stack.values[0]}`).to.be.equal('keccak256(memory[0x10])');
        });

        it('should exec `CREATE`', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x20n));
            state.stack.push(new Val(0x10n));
            state.stack.push(new Val(0x1000n));
            STEP().CREATE(state);
            expect(state.halted).to.be.false;
            expect(state.stack.values).to.be.deep.equal([
                new Create(new Val(0x1000n), new Val(16n), new Val(32n)),
            ]);
            expect(sol`${state.stack.values[0]}`).to.be.equal(
                'new Contract(memory[0x10..0x10+0x20]).value(0x1000).address'
            );
        });

        it('should halt with `STOP`', function () {
            const state = new State<Inst, Expr>();
            STEP().STOP(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Stop()]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return;');
        });

        it('should halt with `SELFDESTRUCT`', function () {
            const state = new State<Inst, Expr>();
            STEP().ADDRESS(state);
            STEP().SELFDESTRUCT(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new SelfDestruct(Info.ADDRESS)]);
            expect(sol`${state.stmts[0]}`).to.be.equal('selfdestruct(address(this));');
        });

        it('should exec `RETURN` with no arguments', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x0n));
            state.stack.push(new Val(0x0n));
            STEP().RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Return(new Val(0n), new Val(0n), [])]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return;');
        });

        it('should exec `RETURN` with a single argument', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x20n));
            state.stack.push(new Val(0x4n));
            STEP().RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Return(new Val(0x4n), new Val(0x20n), [new MLoad(new Val(0x4n))]),
            ]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return memory[0x4];');
        });

        it('should exec `RETURN` with more than one argument', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Add(new Val(0x20n), new Val(0x10n)));
            state.stack.push(new Val(0x4n));
            STEP().RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Return(new Val(0x4n), new Add(new Val(0x20n), new Val(0x10n)), [
                    new MLoad(new Val(0x4n)),
                    new MLoad(new Val(0x24n)),
                ]),
            ]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return (memory[0x4], memory[0x24]);');
        });
    });

    describe('LOGS', function () {
        it('should have empty `events` when emitting `LOG0` event', function () {
            const step = STEP();
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(1n));
            state.stack.push(new Val(2n));
            step.LOG0(state);

            expect(step.events).to.be.deep.equal({});
            expect(state.stmts).to.be.deep.equal([
                new Log(undefined, new Val(2n), new Val(1n), [], [new MLoad(new Val(2n))])
            ]);
        });

        it('should have `events` when emitting `LOG1` event', function () {
            const step = STEP();
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(5n));
            state.stack.push(new Val(1n));
            state.stack.push(new Val(2n));
            step.LOG1(state);

            const topic = 5n.toString(16).padStart(64, '0');
            expect(step.events).to.be.deep.equal({
                [topic]: { indexedCount: 0 },
            } satisfies IEvents);
            expect(state.stmts).to.be.deep.equal([
                new Log(step.events[topic], new Val(2n), new Val(1n), [new Val(5n)], [new MLoad(new Val(2n))])
            ]);
        });
    });

    describe('STORAGE', function () {
        it('should `SSTORE` variable', function () {
            const step = STEP();

            const state = new State<Inst, Expr>();
            state.stack.push(new Val(1n));
            state.stack.push(new Val(2n));
            step.SSTORE(state);

            expect(step.variables).to.have.keys('2');
        });
    });

    describe('FLOW', function () {
        it('should not change state when `JUMPDEST` step', function () {
            const state = new State<Inst, Expr>();
            STEP().JUMPDEST(new State(), new Opcode(0, 0, null, null), Buffer.from([]));
            expect(state).to.be.deep.equal(new State());
        });

        it('should halt when `JUMP` step', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(2n));
            STEP().JUMP(state, new Opcode(1, 0xa, 'jump', null), Buffer.from('ff005b', 'hex'));

            const offset = new Val(2n);
            offset.jumpDest = 2;
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Jump(offset, Branch.make(2, new State()))]);
        });

        it('should halt when `JUMPI` step', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(Block.gaslimit);
            state.stack.push(new Val(4n));
            STEP().JUMPI(state, new Opcode(1, 0xa, 'jumpi', null), Buffer.from('ff0001025b', 'hex'));

            const offset = new Val(4n);
            offset.jumpDest = 4;
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Jumpi(Block.gaslimit, offset, Branch.make(2, new State()), Branch.make(4, new State()))
            ]);
        });

        ['JUMP' as const, 'JUMPI' as const].forEach(inst => {
            it(`should throw when \`${inst}\` step with non-numeric offset`, function () {
                const state = new State<Inst, Expr>();
                if (inst === 'JUMPI') state.stack.push(Block.chainid);
                state.stack.push(Block.number);
                expect(() => STEP()[inst](state, new Opcode(1, 0xa, 'jump', null), Buffer.from([])))
                    .to.throw(`jump(0xa)@1 offset should be numeric but found '${Block.number.tag}'`);
            });

            it(`should throw when \`${inst}\` step with non-\`JUMPDEST\` destination`, function () {
                const state = new State<Inst, Expr>();
                if (inst === 'JUMPI') state.stack.push(Block.chainid);
                state.stack.push(new Val(1n));
                expect(() => STEP()[inst](state, new Opcode(8, 0xa, 'jump', null), Buffer.from([0xff, 0xff])))
                    .to.throw(`jump(0xa)@8 destination should be JUMPDEST@1 but found '0xff'`);
            });

            it(`should throw when \`${inst}\` step with out-of-bounds destination`, function () {
                const state = new State<Inst, Expr>();
                if (inst === 'JUMPI') state.stack.push(Block.chainid);
                state.stack.push(new Val(2n));
                expect(() => STEP()[inst](state, new Opcode(8, 0xa, 'jump', null), Buffer.from([0xff, 0xff])))
                    .to.throw(`jump(0xa)@8 destination should be JUMPDEST@2 but '2' is out-of-bounds`);
            });
        });
    });

});
