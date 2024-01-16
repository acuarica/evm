import { expect } from 'chai';

import { Opcode, type Operand, sol, Stack, State, London, Paris, Shanghai, ExecError, splitMetadataHash, yul } from 'sevm';
import { Val, type Expr, Local, Locali, type Inst, Invalid, MStore, Jump, Branch, Jumpi, Log, type IEvents, Props, DataCopy, Sub, Variable } from 'sevm/ast';
import { Add, Create, MLoad, Return, SelfDestruct, Stop } from 'sevm/ast';
import * as ast from 'sevm/ast';
import { compile } from './utils/solc';
import { fnselector } from './utils/selector';

const sizes = [...Array(16).keys()].map(i => i + 1);

describe('::step', function () {

    describe('Opcode', function () {
        it('should convert null-`data` to hex format', function () {
            expect(new Opcode(0, 0, '').hexData()).to.be.equal(undefined);
        });

        it('should get `nextpc`', function () {
            expect(new Opcode(0, 0, '', new Uint8Array([1, 2, 3, 4])).nextpc).to.be.equal(5);
            expect(new Opcode(3, 0, '', new Uint8Array([1, 2, 3, 4])).nextpc).to.be.equal(8);
        });

        it('should convert `data` to hex format', function () {
            const data = new Uint8Array([1, 2, 3, 4, 12, 13, 14, 15, 254, 255, 0]);
            expect(new Opcode(0, 0, '', data).hexData()).to.be.equal('010203040c0d0e0ffeff00');
        });

        it('should `format` opcodes', function () {
            expect(new Opcode(2, 0x1, 'ADD').format())
                .to.be.equal('ADD(0x1)@2');
            expect(new Opcode(1, 0x63, 'PUSH4', Buffer.from([1, 2, 3, 4])).format())
                .to.be.equal('PUSH4(0x63)@1 0x01020304 (16909060)');
            expect(new Opcode(0, 0xb0, 'INVALID').format())
                .to.be.equal('INVALID(0xb0)@0');
        });

        it('should `format` opcodes with not `includeDataAsNumeric`', function () {
            expect(new Opcode(2, 0x1, 'ADD').format(false))
                .to.be.equal('ADD(0x1)@2');
            expect(new Opcode(1, 0x63, 'PUSH4', Buffer.from([1, 2, 3, 4])).format(false))
                .to.be.equal('PUSH4(0x63)@1 0x01020304');
        });
    });

    describe('support methods', function () {
        const step = new Shanghai();

        it('should retrieve `haltingInsts`', function () {
            const haltingSteps = step.haltingSteps();
            expect(haltingSteps).to.be.deep.equal(
                ['STOP', 'JUMP', 'JUMPI', 'RETURN', 'REVERT', 'INVALID', 'SELFDESTRUCT'] satisfies typeof haltingSteps
            );
        });

        it('should retrieve `opcodes`', function () {
            const opcodes = step.opcodes();
            expect(opcodes.STOP).to.be.equal(0);
            expect(opcodes.ADD).to.be.equal(1);
            expect(opcodes.PUSH32).to.be.equal(0x60 + 32 - 1);
            expect(opcodes.SELFDESTRUCT).to.be.equal(255);
        });

        it('should find decoder table by opcode number', function () {
            expect(step[0]).to.be.deep.equal([0, true, 'STOP']);
            expect(step[1]).to.be.deep.equal([0, false, 'ADD']);
            expect(step[0x60 + 32 - 1]).to.be.deep.equal([32, false, 'PUSH32']);
            expect(step[0xfc]).to.be.deep.equal([0, true, 'UNDEF']);
            expect(step[0xfd]).to.be.deep.equal([0, true, 'REVERT']);
            expect(step[0xfe]).to.be.deep.equal([0, true, 'INVALID']);
            expect(step[0xff]).to.be.deep.equal([0, true, 'SELFDESTRUCT']);

            // @ts-expect-error `add` should not be in Shanghai's mnemonics
            step[0][2] === 'add';
        });

        it('should override `NUMBER` step', function () {
            const stack = new Stack<Expr>();
            let numberWasCalled = false;

            new class extends Shanghai {
                override NUMBER = (state: Operand<Expr>) => {
                    super.NUMBER(state);
                    numberWasCalled = true;
                };
            }().NUMBER({ stack });

            expect(stack.top).to.be.deep.equal(Props['block.number']);
            expect(numberWasCalled, '`NUMBER` step was not overriden').to.be.true;
        });
    });

    describe('decode', function () {
        const step = new London();
        const OPCODES = step.opcodes();

        it('should `decode` unary opcodes', function () {
            expect([...step.decode([OPCODES.ADDRESS, OPCODES.ADDRESS, OPCODES.JUMPDEST, OPCODES.ADD])])
                .to.be.deep.equal([
                    new Opcode(0, OPCODES.ADDRESS, 'ADDRESS'),
                    new Opcode(1, OPCODES.ADDRESS, 'ADDRESS'),
                    new Opcode(2, OPCODES.JUMPDEST, 'JUMPDEST'),
                    new Opcode(3, OPCODES.ADD, 'ADD'),
                ]);
        });

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
                new Opcode(0, OPCODES.PUSH4, 'PUSH4', Buffer.from([1, 2, 3, 4])),
                new Opcode(5, OPCODES.JUMPDEST, 'JUMPDEST'),
                new Opcode(6, OPCODES.PUSH4, 'PUSH4', Buffer.from([5, 6, 7, 8])),
                new Opcode(11, OPCODES.JUMPDEST, 'JUMPDEST'),
                new Opcode(12, OPCODES.ADD, 'ADD'),
            ]);
        });

        it('should fail when `PUSH`n does not have enough data to decode', function () {
            expect(() => step.decode([OPCODES.PUSH32]).next()).to.throw(
                'Trying to get `32` bytes but got only `0` while decoding `PUSH32(0x7f)@0 0x` before reaching the end of bytecode'
            );

            const opcodes = step.decode([OPCODES.ADD, OPCODES.STOP, OPCODES.PUSH20, 1, 2, 3]);
            expect(opcodes.next().value)
                .to.be.deep.equal(new Opcode(0, OPCODES.ADD, 'ADD'));
            expect(opcodes.next().value)
                .to.be.deep.equal(new Opcode(1, OPCODES.STOP, 'STOP'));
            expect(() => opcodes.next()).to.throw(
                'Trying to get `20` bytes but got only `3` while decoding `PUSH20(0x73)@2 0x010203` before reaching the end of bytecode'
            );
        });

        it('should `decode` with `INVALID` opcodes', function () {
            expect([...step.decode([0xb0, OPCODES.ADD, 0xb1])]).to.be.deep.equal([
                new Opcode(0, 0xb0, 'UNDEF'),
                new Opcode(1, OPCODES.ADD, 'ADD'),
                new Opcode(2, 0xb1, 'UNDEF'),
            ]);
        });

        it('should `decode` `PUSHn`', function () {
            expect([...step.decode('0x6003600501')]).to.be.deep.equal([
                new Opcode(0, OPCODES.PUSH1, 'PUSH1', Buffer.from([3])),
                new Opcode(2, OPCODES.PUSH1, 'PUSH1', Buffer.from([5])),
                new Opcode(4, OPCODES.ADD, 'ADD'),
            ]);
        });

        it('should `decode` starting at a non-zero `pc`', function () {
            const bytecode = '0x6003600501';

            expect([...step.decode(bytecode, 2)]).to.be.deep.equal([
                new Opcode(2, OPCODES.PUSH1, 'PUSH1', Buffer.from([5])),
                new Opcode(4, OPCODES.ADD, 'ADD'),
            ]);

            expect([...step.decode(bytecode, 1)]).to.be.deep.equal([
                new Opcode(1, OPCODES.SUB, 'SUB'),
                new Opcode(2, OPCODES.PUSH1, 'PUSH1', Buffer.from([5])),
                new Opcode(4, OPCODES.ADD, 'ADD'),
            ]);
        });

        it('should `decode` all `INVALID` opcodes', function () {
            expect([...step.decode('0c0d0e0ffc')].map(op => op.mnemonic))
                .to.be.deep.equal(Array(5).fill('UNDEF'));
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
            });
        }));

        it('should find method selector decoded as `PUSH3`', function () {
            // "00e4778a": "addAccessoryIdMapping(address,uint64)",
            const src = `contract Test {
                function addAccessoryIdMapping(address, uint64) public pure returns (uint) {
                    return 1;
                }
            }`;
            const { bytecode } = splitMetadataHash(compile(src, '0.7.6', this).bytecode);
            const opcodes = [...new Shanghai().decode(bytecode)];

            const push3 = opcodes.find(o => o.mnemonic === 'PUSH3' && o.hexData() === 'e4778a');
            expect(push3).to.be.not.undefined;
        });

        it('should find method selector decoded as `PUSH1`', function () {
            // "000000c7": "withdrawByAdmin_Unau(uint256[])",
            const src = `contract Test {
                function withdrawByAdmin_Unau(uint256[] calldata) public pure returns (uint) {
                    return 1;
                }
            }`;
            const { bytecode } = splitMetadataHash(compile(src, '0.7.6', this).bytecode);
            const opcodes = [...new Shanghai().decode(bytecode)];

            const push1 = opcodes.find(o => o.mnemonic === 'PUSH1' && o.hexData() === 'c7');
            expect(push1).to.be.not.undefined;
        });

        it('should find `PUSH4` method selector to invoke external contract', function () {
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
            const opcodes = [...new Shanghai().decode(compile(src, '0.7.6', this).bytecode)];

            const selector = fnselector(sig);
            const push4 = opcodes.find(o => o.mnemonic === 'PUSH4' && o.hexData() === selector);
            expect(push4).to.be.not.undefined;
        });

        describe('decode empty contracts should have the same bytecode', function () {
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
                it(title, function () {
                    const { bytecode } = splitMetadataHash(compile(src, '0.7.6', this).bytecode);
                    bytecodes.add(Buffer.from(bytecode).toString('hex'));
                    expect(bytecodes).to.have.length(1);

                    expect([...new Shanghai().decode(bytecode)].map(o => o.mnemonic))
                        .to.be.deep.equal([
                            'PUSH1', 'PUSH1', 'MSTORE', 'PUSH1', 'DUP1', 'REVERT', 'INVALID',
                        ]);
                });
            });
        });
    });

    describe('PUSHES', function () {
        it('should PUSH value onto stack', function () {
            const stack = new Stack<Expr>();
            new London().PUSH1({ stack }, new Opcode(0, 1, 'PUSH1', Buffer.from([1])));
            expect(stack.values).to.deep.equal([new Val(1n, true)]);
        });

        it('should `PUSH0` (`Shanghai`) value onto stack', function () {
            const stack = new Stack<Expr>();
            new Shanghai().PUSH0({ stack });
            expect(stack.values).to.deep.equal([new Val(0n, true)]);
        });
    });

    describe('DUPS', function () {
        const step = new London();

        sizes.forEach(size => {
            it(`should DUP #${size - 1} element on the stack`, function () {
                const state = new State<never, Expr>();
                state.stack.push(new Val(2n));

                const ignored = [];
                for (let i = 1; i < size; i++) {
                    ignored.push(new Val(1n));
                    state.stack.push(new Val(1n));
                }

                step[`DUP${size as Size<16>}`](state);

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

                expect(() => step[`DUP${size as Size<16>}`](state))
                    .to.throw(ExecError, 'Invalid duplication operation');
            });
        });
    });

    describe('SWAPS', function () {
        const step = new Shanghai();

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

                step[`SWAP${size as Size<16>}`]({ stack });

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

                expect(() => step[`SWAP${size as Size<16>}`]({ stack }))
                    .to.throw(ExecError, 'Position not found for swap operation');
            });
        });
    });

    describe('DATACOPY', function () {
        const step = new Shanghai();

        it('should `CODECOPY` executing bytecode into memory', function () {
            const bytecode = Buffer.from('0102030405060708', 'hex');
            const state = new State<Inst, Expr>();

            const [offset, size] = [new Val(2n), new Sub(new Val(7n), new Val(4n))];
            state.stack.push(size);
            state.stack.push(offset);
            state.stack.push(new Val(4n));
            step.CODECOPY(state, new Opcode(0, 0, 'codecopy'), bytecode);

            expect(state.memory).to.be.deep.equal({
                '4': new DataCopy('codecopy', offset, size, undefined, bytecode.subarray(2, 5))
            });
            expect(state.stack.values).to.be.deep.equal([]);
        });
    });

    describe('MEMORY', function () {
        const step = new Shanghai();

        it('should `MSTORE` value into memory', function () {
            const state = new State<Inst, Expr>();

            state.stack.push(Props['block.coinbase']);
            state.stack.push(new Val(4n));
            step.MSTORE(state);

            expect(state.memory).to.be.deep.equal({ '4': Props['block.coinbase'] });
            expect(state.stmts).to.be.deep.equal([new MStore(new Val(4n), Props['block.coinbase'])]);
        });
    });

    describe('SYSTEM', function () {
        const step = new Shanghai();

        it('should halt when `INVALID` step', function () {
            const state = new State<Inst, Expr>();
            step.INVALID(state, new Opcode(0, 1, 'INVALID'));
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Invalid(1)]);
            expect(sol`${state.stmts[0]}`).to.be.equal("revert('Invalid instruction (0x1)');");
        });

        it('should exec `CREATE` with no bytecode', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x20n));
            state.stack.push(new Val(0x10n));
            state.stack.push(new Val(0x1000n));
            step.CREATE(state);
            expect(state.halted).to.be.false;
            expect(state.stack.values).to.be.deep.equal([
                new Create(new Val(0x1000n), new Val(16n), new Val(32n)),
            ]);
            expect(sol`${state.stack.values[0]}`).to.be.equal(
                'new Contract(memory[0x10..0x10+0x20]).value(0x1000).address'
            );
        });

        it('should exec `CREATE` with bytecode', function () {
            const bytecode = Buffer.from('01020304', 'hex');
            const state = new State<Inst, Expr>();

            state.stack.push(new Val(0x4n));
            state.stack.push(new Val(0x10n));
            state.stack.push(new Val(0x1000n));

            state.memory[0x10] = new DataCopy('codecopy', new Val(1n), new Val(2n), undefined, bytecode);

            step.CREATE(state);
            expect(state.stack.values).to.be.deep.equal([
                new Create(new Val(0x1000n), new Val(16n), new Val(4n), bytecode),
            ]);
            expect(sol`${state.stack.values[0]}`).to.be.equal(
                'new Contract(memory[0x10..0x10+0x4]).value(0x1000).address'
            );
        });

        it('should halt with `STOP`', function () {
            const state = new State<Inst, Expr>();
            step.STOP(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Stop()]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return;');
        });

        it('should throw when halting already halted state', function () {
            const state = new State<Inst, Expr>();
            step.STOP(state);
            expect(() => step.STOP(state)).to.throw(ExecError, 'State already halted');
        });

        it('should halt with `SELFDESTRUCT`', function () {
            const state = new State<Inst, Expr>();
            step.ADDRESS(state);
            step.SELFDESTRUCT(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new SelfDestruct(Props['address(this)'])]);
            expect(sol`${state.stmts[0]}`).to.be.equal('selfdestruct(address(this));');
        });

        it('should exec `RETURN` with no arguments', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x0n));
            state.stack.push(new Val(0x0n));
            step.RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Return(new Val(0n), new Val(0n), [])]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return;');
        });

        it('should exec `RETURN` with a single argument', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x20n));
            state.stack.push(new Val(0x4n));
            step.RETURN(state);
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
            step.RETURN(state);
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
            const step = new Shanghai();

            const state = new State<Inst, Expr>();
            state.stack.push(new Val(1n));
            state.stack.push(new Val(2n));
            step.LOG0(state);

            expect(step.events).to.be.deep.equal({});
            expect(state.stmts).to.be.deep.equal([
                new Log(undefined, new Val(2n), new Val(1n), [], [new MLoad(new Val(2n))])
            ]);
            expect(sol`${state.stmts[0]}`).to.be.equal('log(memory[0x2]);');
            expect(yul`${state.stmts[0]}`).to.be.equal('log0(0x2, 0x1)');
        });

        it('should have `events` when emitting `LOG1` event', function () {
            const step = new Shanghai();

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
            expect(sol`${state.stmts[0]}`).to.be.equal('log(0x5, memory[0x2]);');
            expect(yul`${state.stmts[0]}`).to.be.equal('log1(0x2, 0x1, 0x5)');
        });
    });

    describe('STORAGE', function () {
        it('should `SSTORE` variable', function () {
            const step = new Shanghai();

            const state = new State<Inst, Expr>();
            state.stack.push(new Val(1n));
            state.stack.push(new Val(2n));
            step.SSTORE(state);

            expect(state.stmts).to.be.deep.equal([
                new ast.SStore(new Val(2n), new Val(1n), new Variable(null, [new Val(1n)], 1))
            ]);
            expect(step.variables).to.have.keys([2n]);
        });
    });

    describe('FLOW', function () {
        const step = new Shanghai();

        it('should not change state when `JUMPDEST` step', function () {
            const state = new State<Inst, Expr>();
            step.JUMPDEST(new State());
            expect(state).to.be.deep.equal(new State());
        });

        it('should halt when `JUMP` step', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(2n));
            step.JUMP(state, new Opcode(1, 0xa, 'jump'), Buffer.from('ff005b', 'hex'));

            const offset = new Val(2n);
            offset.jumpDest = 2;
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Jump(offset, Branch.make(2, new State()))]);
        });

        it('should halt when `JUMPI` step', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(Props['block.gaslimit']);
            state.stack.push(new Val(4n));
            step.JUMPI(state, new Opcode(1, 0xa, 'jumpi'), Buffer.from('ff0001025b', 'hex'));

            const offset = new Val(4n);
            offset.jumpDest = 4;
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Jumpi(Props['block.gaslimit'], offset, Branch.make(2, new State()), Branch.make(4, new State()))
            ]);
        });

        ['JUMP' as const, 'JUMPI' as const].forEach(inst => {
            it(`should throw when \`${inst}\` step with non-numeric offset`, function () {
                const state = new State<Inst, Expr>();
                if (inst === 'JUMPI') state.stack.push(Props['block.chainid']);
                state.stack.push(Props['block.number']);
                expect(() => step[inst](state, new Opcode(1, 0xa, 'jump'), Buffer.from([])))
                    .to.throw(ExecError, `jump(0xa)@1 offset should be numeric but found '${Props['block.number'].tag}'`);
            });

            it(`should throw when \`${inst}\` step with non-\`JUMPDEST\` destination`, function () {
                const state = new State<Inst, Expr>();
                if (inst === 'JUMPI') state.stack.push(Props['block.chainid']);
                state.stack.push(new Val(1n));
                expect(() => step[inst](state, new Opcode(8, 0xa, 'jump'), Buffer.from([0xff, 0xff])))
                    .to.throw(ExecError, `jump(0xa)@8 destination should be JUMPDEST@1 but found '0xff'`);
            });

            it(`should throw when \`${inst}\` step with out-of-bounds destination`, function () {
                const state = new State<Inst, Expr>();
                if (inst === 'JUMPI') state.stack.push(Props['block.chainid']);
                state.stack.push(new Val(2n));
                expect(() => step[inst](state, new Opcode(8, 0xa, 'jump'), Buffer.from([0xff, 0xff])))
                    .to.throw(ExecError, `jump(0xa)@8 destination should be JUMPDEST@2 but '2' is out-of-bounds`);
            });
        });
    });

    describe('London -> Paris upgrade', function () {
        it('should decode `0x44` -> `DIFFICULTY` with London', function () {
            const step = new London();

            const [, , mnemonic] = step[0x44];
            expect(mnemonic).to.be.deep.equal('DIFFICULTY');

            const stack = new Stack<Expr>();
            step[mnemonic as 'DIFFICULTY']({ stack });
            expect(stack.top).to.be.equal(Props['block.difficulty']);
        });

        it('should decode `0x44` -> `PREVRANDAO` with Paris', function () {
            const step = new Paris();

            const [, , mnemonic] = step[0x44];
            expect(mnemonic).to.be.deep.equal('PREVRANDAO');

            const stack = new Stack<Expr>();
            step[mnemonic as 'PREVRANDAO']({ stack });
            expect(stack.top).to.be.equal(Props['block.prevrandao']);
        });
    });
});
