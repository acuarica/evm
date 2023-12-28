import { strict as assert } from 'assert';
import { expect } from 'chai';

import { EVM, London, Shanghai, State, sol, solEvents, solStmts, yul, yulStmts, type Operand } from 'sevm';
import type { Expr, Inst, Local, Log } from 'sevm/ast';
import { Add, Invalid, Jump, JumpDest, Jumpi, MappingLoad, MappingStore, Props, Sha3, Sig, Stop, Sub, Throw, Val } from 'sevm/ast';

import { eventSelector, fnselector } from './utils/selector';
import { compile, type Version } from './utils/solc';

describe('::evm', function () {

    it('should find opcodes when exec `containsOpcode`', function () {
        const evm = new EVM('0x60016002ff');
        expect(evm.containsOpcode('PUSH1')).to.be.true;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.true;
        expect(evm.containsOpcode('ADD')).to.be.false;
        expect(evm.containsOpcode('SUB')).to.be.false;
    });

    it('should throw in `containsOpcode` when providing invalid opcode', function () {
        type OpcodeType = keyof InstanceType<typeof Shanghai>['opcodes'];
        const evm = new EVM('0x');
        expect(() => evm.containsOpcode('add' as OpcodeType))
            .to.throw('Provided opcode `add` is not a valid opcode mnemonic');
        expect(() => evm.containsOpcode('haltingSteps' as OpcodeType))
            .to.throw('Provided opcode `haltingSteps` is not a valid opcode mnemonic');
    });

    it('should halt when `exec` invalid opcode', function () {
        const evm = new EVM('0xd001');
        const state = evm.start();

        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new Invalid(0xd0)]);
        expect(sol`${state.stmts[0]}`).to.be.equal("revert('Invalid instruction (0xd0)');");
        expect(yul`${state.stmts[0]}`).to.be.equal('invalid()');
        expect(evm.containsOpcode(0xd0)).to.be.true;
        expect(evm.containsOpcode('ADD')).to.be.false;
    });

    it('should throw when exec `halted` state', function () {
        const state = new State<Inst, Expr>();
        const evm = new EVM('0x');
        state.halt(new Stop());
        expect(() => evm.exec(0, state)).to.throw('State at 0 must be non-halted to be `exec`');
    });

    it('should throw when finishing exec non-`halted` state', function () {
        const state = new State<Inst, Expr>();
        const evm = new EVM('0x6001600201');
        expect(() => evm.exec(0, state)).to.throw('State must be halted after `exec` at 0:5');
    });

    it('should halt when `exec` invalid opcode & state', function () {
        const state = new State<Inst, Expr>();
        const evm = new EVM('0x01');
        evm.exec(0, state);

        const err = new Throw('POP with empty stack', evm.opcodes[0], state);

        expect(evm.errors).to.be.deep.equal([err]);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([err]);
        expect(sol`${state.stmts[0]}`).to.be.equal("throw('POP with empty stack');");
    });

    it('should attach `STEP` hooks', function () {
        const src = `contract Test {
            event Deposit(uint256);
            fallback () external payable {
                emit Deposit(block.gaslimit);
                emit Deposit(block.gaslimit);
                emit Deposit(tx.gasprice);
            }
        }`;
        let count = 0, gasLimit = null, gasPrice = null;

        const evm = new EVM(compile(src, '0.7.6', this).bytecode, new class extends London {
            override GASLIMIT = (state: Operand<Expr>) => {
                count++;
                super.GASLIMIT(state);
                gasLimit = state.stack.top;
            };

            override GASPRICE = (state: Operand<Expr>) => {
                super.GASPRICE(state);
                gasPrice = state.stack.top;
            };
        }());

        evm.start();
        expect(count).to.be.equal(2);
        expect(gasLimit).to.be.equal(Props['block.gaslimit']);
        expect(gasPrice).to.be.equal(Props['tx.gasprice']);
    });

    it('should dedup locals when ref non-inlineable value', function () {
        const src = `contract Test {
            event Deposit(uint256);
            fallback () external payable {
                uint256 n = block.number;
                emit Deposit(n);
                emit Deposit(n * 3);
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        const main = evm.start();
        expect(evm.step.functionBranches).to.be.empty;
        expect(evm.opcodes.filter(op => op.mnemonic === 'NUMBER')).to.have.length(1);
        const local = 'local0';
        const topic = eventSelector('Deposit(uint256)');
        expect(solStmts(main.stmts).trim().split('\n')).to.be.deep.equal([
            `uint ${local} = block.number; // #refs 1`,
            `log(0x${topic}, ${local});`,
            `log(0x${topic}, ${local} * 0x3);`,
            'return;',
        ]);
    });

    it('if0', function () {
        const src = `contract Test {
            uint256 value;
            fallback () external payable {
                uint256 temp;
                if (block.number == 7) {
                    temp = 3;
                } else {
                    temp = 5;
                }
                value = temp;
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        // const main =
        // evm.start();
        const state = new State<Inst, Expr>();
        evm.exec(19, state);
        // console.log(state.stmts);
        // console.log(state.stack);
        // console.log(evm.errors);
        expect(evm.step.functionBranches).to.be.empty;
    });

    it('should create ', function () {
        const src = `contract Test {
            event Deposit(uint256);
                modifier onlyOwner(uint256 m) {
                    // require(block.timestamp == 5);
                    // uint256 n = block.number;
                    for (uint256 i = 0; i < block.number; i++) {
                        m += block.number * i;
                    }
                    // n += gasleft();
                    require(m == 9);
                    _;
                 }

                function _get(uint256 n) internal view returns (uint256) {
                    for (uint256 i = 0; i < block.number; i++) {
                        n += block.number;
                    }
                    return n;
                }

                function name(uint256 n) external onlyOwner(n) {
                    emit Deposit(_get(n));
                }

                function symbol(uint256 m) external view onlyOwner(m) returns (uint256) {
                    return _get(m);
                }
            }`;

        const evm = new EVM(compile(src, '0.7.6', this, {
            optimizer: { enabled: true }
        }).bytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it('should for loop', function () {
        const src = `contract Test {
            event Deposit(uint256);
            fallback() external payable {
                for (uint256 i = 0; i < 10; i++) emit Deposit(i);
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        // const main =
        evm.start();
        // require('util').inspect.defaultOptions.depth = null;
        // console.log(build(main));
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it.skip('should detect unbounded loop', function () {
        const src = `contract Test {
            // event Deposit(uint256);
            uint256 value;
            

            fallback() external payable {
                // for (uint256 i = 0; i < block.number; i++) emit Deposit(i);
                for (uint256 i = 0; i < block.number; i++) value = i;
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        const main = evm.start();

        // require('util').inspect.defaultOptions.depth = null;
        // console.log(main);

        // main.stmts.forEach(s => console.log(s));
        // console.log(main.stmts);

        // console.log(solStmts(build(main)));
        expect(evm.step.functionBranches).to.be.empty;

        assert(main.last instanceof JumpDest);
        const head = main.last.fallBranch.state;
        assert(head.last instanceof Jumpi);
        const body = head.last.fallBranch.state;
        // console.log(body.stmts);
        // console.log(body.stack);
        assert(body.last instanceof Jump);
        const exit = head.last.destBranch.state;
        assert(exit.last instanceof Stop);

        expect(evm.blocks).to.have.lengthOf(4);
        const pcs = [0, main.last.fallBranch.pc, head.last.fallBranch.pc, head.last.destBranch.pc];
        expect(new Set(evm.blocks.keys())).to.be.deep.equal(new Set(pcs));

        expect(evm.blocks.get(0)!.states).to.have.length(1);
        expect(evm.blocks.get(0)!.states[0]).to.be.equal(main);
        expect(evm.blocks.get(main.last.fallBranch.pc)!.states).to.have.length(1);
        expect(evm.blocks.get(main.last.fallBranch.pc)!.states[0]).to.be.equal(head);
        expect(evm.blocks.get(head.last.fallBranch.pc)!.states).to.have.length(1);
        expect(evm.blocks.get(head.last.fallBranch.pc)!.states[0]).to.be.equal(body);
        expect(evm.blocks.get(head.last.destBranch.pc)!.states).to.have.length(1);
        expect(evm.blocks.get(head.last.destBranch.pc)!.states[0]).to.be.equal(exit);

        expect(body.last.destBranch.state).to.be.equal(head);
    });

    it('should detect infinite for-loop', function () {
        const src = `contract Test { event Deposit(uint256);
            fallback() external payable {
                for (uint256 i = 0; i < block.number; ) emit Deposit(i);
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it('should detect recursive function', function () {
        const src = `contract Test {
                event Transfer(uint256);
                function transfer(uint256 amount) public {
                    emit Transfer(amount);
                    // if (amount % 2 == 0) {
                        _transfer(amount + 5);
                    // }
                }
                function _transfer(uint256 amount) internal returns (uint256) {
                    if (amount % 2 == 0) {
                        transfer(amount + 5);
                    }
                    return amount + 7;
                }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    describe('special', function () {
        Object.values(Props).forEach(prop => {
            it(`should get \`${prop.symbol}\` from compiled code`, function () {
                const src = `contract Test {
                        event Deposit(${prop.type});
                        fallback() external payable {
                            ${['codesize()', 'returndatasize()'].includes(prop.symbol)
                        ? `uint256 value; assembly { value := ${prop.symbol} } emit Deposit(value);`
                        : `emit Deposit(${prop.symbol});`}
                        }
                    }`;

                const bytecode = (version: Version) => compile(src, version, this, { optimizer: { enabled: true } }).bytecode;
                const evm = prop.symbol === 'block.difficulty'
                    ? new EVM(bytecode('0.8.16'), new London())
                    : new EVM(bytecode('0.8.21'), new Shanghai());
                // TODO: fix
                // const a = prop.symbol === 'block.difficulty'
                //     ? [bytecode('0.8.16'), new London() ] as const
                //     : [bytecode('0.8.21'), new Shanghai() ] as const;
                // const evm = new EVM(d);

                const state = new State<Inst, Expr>();
                evm.run(0, state);

                expect(state.stmts.at(-1)).to.be.deep.equal(new Stop());

                const stmt = state.stmts.at(-2)!;
                expect(stmt.name).to.be.equal('Log');
                expect((stmt as Log).args![0].eval()).to.be.deep.equal(prop);
            });
        });
    });

    describe('log', function () {
        it('should decompile known and unknown events with locals', function () {
            const knownEventSig = 'Deposit(uint256)';
            const unknownEventSig = 'UnknownEvent(uint256, uint256, uint256)';
            const src = `contract Test {
            event ${knownEventSig};
            event ${unknownEventSig};
            fallback() external payable {
                emit Deposit(1);
                emit UnknownEvent(2, 3, 4);
                uint256 n = block.number;
                emit Deposit(n);
                emit Deposit(n + 7);
            }
        }`;
            const evm = new EVM(compile(src, '0.7.6', this).bytecode);

            const state = new State<Inst, Expr>();
            evm.exec(0, state);
            const ev = knownEventSig;
            evm.step.events[eventSelector(ev)].sig = ev;

            expect(evm.step.events).to.have.keys(
                eventSelector(knownEventSig),
                eventSelector(unknownEventSig)
            );
            expect(evm.step.events[eventSelector(knownEventSig)]).to.be.deep.equal({
                sig: knownEventSig,
                indexedCount: 0,
            });

            expect(solEvents(evm.step.events)).to.be.equal(`event Deposit(uint256 _arg0);
event ${eventSelector(unknownEventSig)};
`);

            const stmts = state.stmts.filter(stmt => stmt.name === 'Log');

            assert(stmts[0].name === 'Log');
            assert(stmts[0].args![0].tag === 'Local');
            expect(stmts[0].args![0].value).to.be.deep.equal(new Val(1n, true));
            expect(stmts[0].eventName).to.be.deep.equal('Deposit');

            assert(stmts[1].name === 'Log');
            assert(stmts[1].args?.every((e): e is Local => e.tag === 'Local'));
            expect(stmts[1].args?.map(e => e.value)).to.be.deep.equal([
                new Val(2n, true),
                new Val(3n, true),
                new Val(4n, true),
            ]);

            const topic = eventSelector(unknownEventSig);
            const local = 'local10';
            expect(solStmts(state.stmts).trim().split('\n')).to.be.deep.equal([
                'emit Deposit(0x1);',
                `log(0x${topic}, 0x2, 0x3, 0x4);`,
                `uint ${local} = block.number; // #refs 1`,
                `emit Deposit(${local});`,
                `emit Deposit(${local} + 0x7);`,
                'return;',
            ]);
            expect(yulStmts(state.stmts).trim().split('\n')).to.be.deep.equal([
                'mstore(0x40, 0x80)',
                'mstore(0x80, 0x1)',
                'log1(0x80, sub(add(0x20, 0x80), 0x80), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)',
                'mstore(0x80, 0x2)',
                'mstore(add(0x20, 0x80), 0x3)',
                'mstore(add(0x20, add(0x20, 0x80)), 0x4)',
                `log1(0x80, sub(add(0x20, add(0x20, add(0x20, 0x80))), 0x80), 0x${topic})`,
                `let ${local}: uint = number() // #refs 1`,
                `mstore(0x80, ${local})`,
                `log1(0x80, sub(add(0x20, 0x80), 0x80), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)`,
                `mstore(0x80, add(${local}, 0x7))`,
                `log1(0x80, sub(add(0x20, 0x80), 0x80), 0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426)`,
                'stop()',
            ]);
        });
    });

    describe('storage', function () {

        it.skip('should detect storage variable', function () {
            const src = `contract Test {
            uint256 val1 = 5;
            uint256 val2 = 7;
            fallback() external payable {
                val1 += 3;
                val2 += 11;
            }}`;
            const evm = new EVM(compile(src, '0.7.6', this).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            expect(evm.step.variables).to.be.have.keys('0', '1');
            expect(state.stmts).to.be.have.length(3);

            expect(sol`${state.stmts[0]}`).to.be.equal('var1 += 0x3;');
            expect(sol`${state.stmts[1]}`).to.be.equal('var2 += 0xb;');
            expect(sol`${state.last}`).to.be.equal('return;');

            expect(yul`${state.stmts[0]}`).to.be.equal('sstore(0x0, add(sload(0x0), 0x3))');
            expect(yul`${state.stmts[1]}`).to.be.equal('sstore(0x1, add(sload(0x1), 0xb))');
            expect(yul`${state.last}`).to.be.equal('stop()');
        });

        it.skip('should detect packed storage variable', function () {
            const src = `contract Test {
            uint256 val1 = 0;
            uint128 val2 = 7;
            uint128 val3 = 11;
            function() external payable {
                // unchecked {
                val1 = block.number + 5;
                // val2 = uint128(block.number) + 7;
                val3 = uint128(block.number) + 11;
                // uint64 val4 = 9;
                // }
            }}`;
            const evm = new EVM(compile(src, '0.5.5', this).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            // state.stmts.forEach(stmt => console.log(sol`${stmt.eval()}`));
            // state.stmts.forEach(stmt => console.log(yul`${stmt.eval()}`));

            expect(Object.keys(evm.step.variables)).to.be.have.length(3);
        });

        it.skip('should find storage struct when no optimized', function () {
            const src = `contract Test {
            struct T { uint256 val1; uint256 val2; }
            T t;
                uint256 val3;
            fallback() external payable {
                t.val1 += 3;
                t.val2 += 11;
                val3 += 7;
            }}`;
            const evm = new EVM(compile(src, '0.7.6', this, {
                optimizer: { enabled: false }
            }).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);
            // state.stmts.forEach(stmt => console.log(sol`${stmt}`));
            // state.stmts.forEach(stmt => console.log(yul`${stmt}`));

            expect(evm.step.variables).to.be.have.keys('0x0', '0x1');
            expect(evm.step.mappings).to.be.deep.equal({});
        });

        it.skip('should not find storage struct when optimized', function () {
            const src = `contract Test {
            struct T { uint256 val1; uint256 val2; }
            T t;
            fallback() external payable {
                t.val1 += 3;
                t.val2 += 11;
            }}`;
            const evm = new EVM(compile(src, '0.7.6', this, {
                optimizer: { enabled: true }
            }).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            expect(state.stmts).to.be.have.length(3);

            expect(sol`${state.stmts[0]}`).to.be.equal('var1 += 0x3;');
            expect(sol`${state.stmts[1]}`).to.be.equal('var2 += 0xb;');
            expect(sol`${state.stmts[2]}`).to.be.equal('return;');

            expect(yul`${state.stmts[0]}`).to.be.equal('sstore(0x0, add(0x3, sload(0x0)))');
            expect(yul`${state.stmts[1]}`).to.be.equal('sstore(0x1, add(0xb, sload(0x1)))');
            expect(yul`${state.stmts[2]}`).to.be.equal('stop()');

            expect(evm.step.variables).to.be.have.keys('0', '1');
            expect(evm.step.mappings).to.be.deep.equal({});
        });

        describe('mappings', function () {
            it.skip('should find mapping loads and stores', function () {
                const src = `contract Test {
                mapping (address => uint256) map1;
                mapping (address => uint256) map2;
                mapping (address => mapping (address => uint256)) allowance;

                fallback() external payable {
                    map1[msg.sender] += 3;
                    map2[msg.sender] += 5;
                    allowance[address(this)][msg.sender] -= 11;
                }
            }`;
                const evm = new EVM(compile(src, '0.7.6', this).bytecode);
                const state = new State<Inst, Expr>();
                evm.run(0, state);

                expect(state.stmts).to.be.have.length(4);

                {
                    const size = new Add(
                        new Val(32n, true),
                        new Add(new Val(32n, true), new Val(0n, true))
                    );
                    const slot = new Sha3(new Val(0n, true), size, [Props['msg.sender'], new Val(0n, true)]);
                    expect(state.stmts[0]).to.be.deep.equal(
                        new MappingStore(slot, evm.step.mappings, 0, [Props['msg.sender']],
                            new Add(
                                new MappingLoad(slot, evm.step.mappings, 0, [Props['msg.sender']]),
                                new Val(3n, true)
                            )
                        )
                    );
                    expect(sol`${state.stmts[0]}`).to.be.equal('mapping1[msg.sender] += 0x3;');
                    expect(yul`${state.stmts[0]}`).to.be.equal(
                        'sstore(keccak256(0x0, add(0x20, add(0x20, 0x0))), add(sload(0/*[msg.sender]*/), 0x3)) /*0[msg.sender]*/'
                    );
                }

                {
                    const size = new Add(
                        new Val(32n, true),
                        new Add(new Val(32n, true), new Val(0n, true))
                    );
                    const slot = new Sha3(new Val(0n, true), size, [Props['msg.sender'], new Val(1n, true)]);
                    expect(state.stmts[1]).to.be.deep.equal(
                        new MappingStore(slot, evm.step.mappings, 1, [Props['msg.sender']],
                            new Add(
                                new MappingLoad(slot, evm.step.mappings, 1, [Props['msg.sender']]),
                                new Val(5n, true)
                            )
                        )
                    );
                    expect(sol`${state.stmts[1]}`).to.be.equal('mapping2[msg.sender] += 0x5;');
                    expect(yul`${state.stmts[1]}`).to.be.equal(
                        'sstore(keccak256(0x0, add(0x20, add(0x20, 0x0))), add(sload(1/*[msg.sender]*/), 0x5)) /*1[msg.sender]*/'
                    );
                }

                {
                    const size = new Add(
                        new Val(32n, true),
                        new Add(new Val(32n, true), new Val(0n, true))
                    );
                    const slot = new Sha3(new Val(0n, true), size, [
                        Props['msg.sender'],
                        new Sha3(new Val(0n, true), size, [Props['address(this)'], new Val(2n, true)]),
                    ]);
                    expect(state.stmts[2]).to.be.deep.equal(
                        new MappingStore(slot, evm.step.mappings, 2, [Props['address(this)'], Props['msg.sender']],
                            new Sub(
                                new MappingLoad(slot, evm.step.mappings, 2, [Props['address(this)'], Props['msg.sender']]),
                                new Val(11n, true)
                            )
                        )
                    );
                }

                expect(sol`${state.stmts[2]}`).to.be.equal(
                    'mapping3[address(this)][msg.sender] -= 0xb;'
                );
                expect(yul`${state.stmts[2]}`).to.be.equal(
                    'sstore(keccak256(0x0, add(0x20, add(0x20, 0x0))), sub(sload(2/*[address(this)][msg.sender]*/), 0xb)) /*2[address(this)][msg.sender]*/'
                );
                expect(state.last).to.be.deep.equal(new Stop());
                expect(evm.step.variables).to.be.empty;
            });
        });
    });

    describe('flow', function () {
        it('should detect `EQ` `balanceOf` function selector', function () {
            const balanceOf = 'balanceOf(address addr)';
            const selector = fnselector(balanceOf);
            const src = `contract Test {
                function ${balanceOf} external payable returns (address) {
                    return addr;
                }
            }`;
            const evm = new EVM(compile(src, '0.7.6', this).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            assert(state.last!.name === 'Jumpi');
            assert(state.last.fallBranch.state.last?.name === 'SigCase');
            expect(state.last.fallBranch.state.last?.condition).to.be.deep.equal(new Sig(selector));
        });
    });

});
