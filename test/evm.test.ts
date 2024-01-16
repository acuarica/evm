import { strict as assert } from 'assert';
import { expect } from 'chai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import type { Operand, Ram } from 'sevm';
import { EVM, London, Opcode, Paris, Shanghai, State, build, sol, solEvents, solStmts, splitMetadataHash, yul, yulStmts } from 'sevm';
import type { Create, DataCopy, Expr, Inst, Log } from 'sevm/ast';
import { Add, And, Local, Invalid, Jump, JumpDest, Jumpi, MappingLoad, MappingStore, Not, Props, Sha3, Sig, Stop, Sub, Throw, Val } from 'sevm/ast';

import { eventSelector, fnselector } from './utils/selector';
import { compile, type Version } from './utils/solc';

describe('::evm', function () {
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

        const evm = new EVM(compile(src, '0.7.6', this, {
            optimizer: { enabled: true }
        }).bytecode, new class extends London {
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
        const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
        const main = evm.start();
        expect(evm.step.functionBranches).to.be.empty;
        expect(
            evm.blocks.get(0)?.opcodes.filter(({ opcode, }) => opcode.mnemonic === 'NUMBER')
        ).to.have.length(1);

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
        const evm = EVM.new(compile(src, '0.7.6', this, { optimizer: { enabled: true } }).bytecode);
        evm.start();

        expect(evm.step.functionBranches).to.be.empty;
        expect(evm.errors).to.be.empty;
        // expect(cfg(evm)).to.matchSnapshot('mermaid', this);
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

        const evm = EVM.new(compile(src, '0.7.6', this, {
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
        const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
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
        const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
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
        const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
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
        const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
        evm.start();
        // expect(evm.functionBranches).to.have.keys(fnselector('name()'), fnselector('symbol()'));
    });

    it('should not accept `PUSH0` as a valid opcode in Paris fork', function () {
        const src = `contract Test {
            event Deposit(uint256);
            fallback() external payable {
                emit Deposit(0);
            }
        }`;

        const bytecode = compile(src, '0.8.21', this, { optimizer: { enabled: true } }).bytecode;

        const opcodes = [...new Shanghai().decode(bytecode)].map(o => o.mnemonic);
        expect(opcodes).to.contain('PUSH0');

        const evm = new EVM(bytecode, new Paris());
        const state = evm.start();
        expect(evm.errors).to.be.empty;
        expect(state.stmts.at(-1)).to.be.deep.equal(new Invalid(new Shanghai().opcodes().PUSH0));
    });

    it('should decode `prevrandao` as `difficulty` using an older fork', function () {
        const src = `contract Test {
            event Deposit(uint256);
            fallback() external payable {
                emit Deposit(block.prevrandao);
            }
        }`;
        const evm = new EVM(compile(src, '0.8.21', this, { optimizer: { enabled: true } }).bytecode, new London());
        const state = evm.start();
        expect(evm.errors).to.be.empty;
        expect((state.stmts.at(-2) as Log).args).to.be.deep.equal([Props['block.difficulty']]);
    });

    it('CHECK find type cast for `uint128` using `And`', function () {
        const src = `contract Test {
            event Deposit(uint128); 
            fallback () external payable {
                emit Deposit(uint128(~block.number));
            }
        }`;
        const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
        const state = new State<Inst, Expr>();
        evm.run(0, state);

        const stmt = state.stmts.at(-2)!;
        assert(stmt.name === 'Log');
        expect(stmt.args![0]).to.be.deep.equal(
            new And(
                new Val(BigInt('0x' + 'ff'.repeat(16)), true),
                new Local(1, new Not(Props['block.number']))
            )
        );
    });

    it("should find '0x00000000' method selector decoded as `PUSH1 0x00|EQ`", function () {
        // https://www.4byte.directory/signatures/?bytes4_signature=0x00000000
        // 0x00000000: wycpnbqcyf()	
        const src = `contract Test {
            function wycpnbqcyf() public payable returns (uint) {
                return 1;
            }
        }`;
        const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
        evm.start();
        expect(evm.step.functionBranches).to.have.keys('00000000');
    });

    it("should find '0x00000000' method selector decoded as `ISZERO`", function () {
        const src = `contract Test {
            function wycpnbqcyf() public payable returns (uint) {
                return 1;
            }
        }`;
        const evm = EVM.new(compile(src, '0.7.6', this, { optimizer: { enabled: true } }).bytecode);
        evm.start();

        const opcodes = evm.blocks.get(12)!.opcodes.map(({ opcode }) => opcode.format());
        expect(opcodes).to.be.deep.equal([
            'PUSH1(0x60)@12 0x00 (0)',
            'CALLDATALOAD(0x35)@14',
            'PUSH1(0x60)@15 0xe0 (224)',
            'SHR(0x1c)@17',
            'DUP1(0x80)@18',
            'ISZERO(0x15)@19',
            'PUSH1(0x60)@20 0x1c (28)',
            'JUMPI(0x57)@22',
        ]);

        expect(evm.step.functionBranches).to.have.keys('00000000');
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

                const state = new State<Inst, Expr>();
                evm.run(0, state);

                expect(state.stmts.at(-1)).to.be.deep.equal(new Stop());

                const stmt = state.stmts.at(-2)!;
                expect(stmt.name).to.be.equal('Log');
                expect((stmt as Log).args![0].eval()).to.be.deep.equal(prop);
            });
        });
    });

    describe('system', function () {
        it('should find `RETURN` in bytecode', function () {
            const src = `contract Test { 
                function name() external pure returns (uint256) { return 7; }
                function symbol() external pure returns (uint256) { return 11; }
                function hola() external pure returns (string memory) { return "12345"; }
            }`;

            const evm = EVM.new(compile(src, '0.8.16', this, {
                optimizer: {
                    enabled: true, details: { jumpdestRemover: true },
                }
            }).bytecode);
            evm.start();

            const selector = fnselector('name()');
            const symbolSelector = fnselector('symbol()');
            const hola = fnselector('hola()');
            expect(evm.step.functionBranches).to.have.keys(selector, symbolSelector, hola);

            const ast = (selector: string) => build(evm.step.functionBranches.get(selector)!.state);

            expect(solStmts(ast(selector))).to.be.deep.equal('return 0x7;\n');
            expect(solStmts(ast(symbolSelector))).to.be.deep.equal('return 0xb;\n');
            expect(solStmts(ast(hola)).trim().split('\n').at(-1)).to.be.deep.equal("return '12345';");
        });

        it('should stringify `CREATE` and find `CODECOPY` Contract', function () {
            const depositEvent = 'Deposit(uint256)';
            const src = `
            contract Token {
                event ${depositEvent};
                fallback() external payable {
                    emit Deposit(3);
                }
            }

            contract Test {
                fallback() external payable {
                    new Token();
                }
            }`;

            let tokenBytecode: Uint8Array | undefined = undefined;
            const step = new class extends Shanghai {
                override CREATE = (state: State<Inst, Expr>) => {
                    super.CREATE(state);
                    const bytecode = (state.stack.top as Create).bytecode!;

                    new EVM(bytecode, new class extends London {
                        override CODECOPY = ({ stack, memory }: Ram<Expr>, _: unknown, bytecode: Uint8Array) => {
                            const dest = stack.top?.eval();
                            super.CODECOPY({ stack, memory }, _, bytecode);

                            if (dest?.isVal()) {
                                const m = memory[Number(dest.val)] as DataCopy;
                                tokenBytecode = m.bytecode;
                            }
                        };
                    }()).start();
                };
            }();

            const evm = new EVM(compile(src, '0.8.16', this, { optimizer: { enabled: true } }).bytecode, step);
            const state = new State<Inst, Expr>();
            evm.run(0, state);
            const stmts = build(state);
            expect(sol`${stmts[6].eval()}`).to.be.deep.equal(
                'require(new Contract(memory[0x80..0x80+0x85]).value(0x0).address);'
            );
            expect(sol`${stmts[7]}`).to.be.deep.equal('return;');

            {
                expect(tokenBytecode).to.be.not.undefined;
                const evm = EVM.new(tokenBytecode!);
                const state = evm.start();
                expect(sol`${state.stmts.at(-2)}`)
                    .to.be.equal('log(0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426, 0x3);');
            }
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
                    emit Deposit(n +   7);
                }
            }`;
            const evm = EVM.new(compile(src, '0.7.6', this).bytecode);

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
            expect(yulStmts(state.stmts)).to.matchSnapshot('yul', this);
        });
    });

    describe('storage', function () {
        it('should detect storage variable', function () {
            const src = `contract Test {
            uint256 val1 = 5;
            uint256 val2 = 7;
            fallback() external payable {
                val1 += 3;
                val2 += 11;
            }}`;
            const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            expect(evm.step.variables).to.be.have.keys([0n, 1n]);

            expect(yulStmts(state.stmts).trim().split('\n')).to.be.deep.equal([
                'mstore(0x40, 0x80)',
                'let local0 = 0x0 // #refs 0',
                'let local1 = 0x3 // #refs 0',
                'let local2 = add(sload(local0), local1) // #refs 0',
                'sstore(local0, local2)',
                'let local3 = 0xb // #refs 0',
                'let local4 = 0x1 // #refs -1',
                'let local5 = add(sload(local4), local3) // #refs 0',
                'sstore(local4, local5)',
                'stop()',
            ]);

            expect(solStmts(state.stmts).trim().split('\n')).to.be.deep.equal([
                'var_1 += 0x3;',
                'var_2 += 0xb;',
                'return;',
            ]);
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
            const evm = EVM.new(compile(src, '0.5.5', this).bytecode);
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
            const evm = EVM.new(compile(src, '0.7.6', this, {
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
            const evm = EVM.new(compile(src, '0.7.6', this, {
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
                const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
                const state = new State<Inst, Expr>();
                evm.run(0, state);

                const stmts = state.stmts.filter(stmt => stmt.name === 'MappingStore');
                expect(stmts).to.be.have.length(3);

                {
                    const size = new Add(
                        new Val(32n, true),
                        new Add(new Val(32n, true), new Val(0n, true))
                    );
                    const slot = new Sha3(new Val(0n, true), size, [Props['msg.sender'], new Val(0n, true)]);
                    expect(stmts[0]).to.be.deep.equal(
                        new MappingStore(slot, evm.step.mappings, 0, [Props['msg.sender']],
                            new Add(
                                new MappingLoad(slot, evm.step.mappings, 0, [Props['msg.sender']]),
                                new Val(3n, true)
                            )
                        )
                    );
                    expect(sol`${stmts[0]}`).to.be.equal('mapping1[msg.sender] += 0x3;');
                    expect(yul`${stmts[0]}`).to.be.equal(
                        'sstore(keccak256(0x0, add(0x20, add(0x20, 0x0))), add(sload(0/*[caller()]*/), 0x3)) /*0[caller()]*/'
                    );
                }

                {
                    const size = new Add(
                        new Val(32n, true),
                        new Add(new Val(32n, true), new Val(0n, true))
                    );
                    const slot = new Sha3(new Val(0n, true), size, [Props['msg.sender'], new Val(1n, true)]);
                    expect(stmts[1]).to.be.deep.equal(
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
            const evm = EVM.new(compile(src, '0.7.6', this).bytecode);
            const state = new State<Inst, Expr>();
            evm.run(0, state);

            assert(state.last!.name === 'Jumpi');
            assert(state.last.fallBranch.state.last?.name === 'SigCase');
            expect(state.last.fallBranch.state.last?.condition).to.be.deep.equal(new Sig(selector));
        });
    });

    describe('exec', function () {
        it('should halt when `exec` invalid opcode', function () {
            const evm = EVM.new('0xd001');
            const state = evm.start();

            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Invalid(0xd0)]);
            expect(sol`${state.stmts[0]}`).to.be.equal("revert('Invalid instruction (0xd0)');");
            expect(yul`${state.stmts[0]}`).to.be.equal('invalid()');
            expect(evm.opcodes().filter(o => o.opcode === 0xd0)).to.be.deep.equal([new Opcode(0, 0xd0, 'UNDEF')]);
            expect(evm.opcodes().filter(o => o.mnemonic === 'ADD')).to.be.empty;
        });

        it('should throw when `exec` `halted` state', function () {
            const state = new State<Inst, Expr>();
            const evm = EVM.new('0x');
            state.halt(new Stop());
            expect(() => evm.exec(0, state)).to.throw('State at 0 must be non-halted to be `exec`');
        });

        it('should throw when `exec` empty block', function () {
            const state = new State<Inst, Expr>();
            const evm = EVM.new('0x0102');
            expect(() => evm.exec(2, state)).to.throw('Executing block at 2 cannot be empty');
        });

        it('should throw when finishing exec non-`halted` state', function () {
            const state = new State<Inst, Expr>();
            const evm = EVM.new('0x6001600201');
            expect(() => evm.exec(0, state)).to.throw('State must be halted after executing block at 0..4');
        });

        it('should halt when `exec` invalid opcode & state', function () {
            const state = new State<Inst, Expr>();
            const evm = EVM.new('0x01');
            evm.exec(0, state);

            const err = new Throw('POP with empty stack', new Opcode(0, 0x1, 'ADD'), state);

            expect(evm.errors).to.be.deep.equal([err]);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([err]);
            expect(sol`${state.stmts[0]}`).to.be.equal("throw('POP with empty stack');");
            expect(yul`${state.stmts[0]}`).to.be.equal("throw('POP with empty stack');");
        });

        it('should `exec` valid bytecode', function () {
            const state = new State<Inst, Expr>();
            const evm = EVM.new('0x600160020100');
            evm.exec(0, state);
            expect(state.halted).to.be.true;
            expect(state.stack.values).to.be.deep.equal([new Add(new Val(2n, true), new Val(1n, true))]);
            expect(evm.errors).to.be.empty;
        });

        it('should populate `blocks` (and `chunks`) after `exec` `JUMP`s', function () {
            //             chunks: 0 1 2 3 4 5 6 7|8 9 a b|c d e f 0|1 2 3
            const evm = EVM.new('0x6001600201600c56010203045b62fffefd5b00');

            let state = new State<Inst, Expr>();
            evm.exec(0, state);
            expect(state.last?.name).to.be.deep.equal('Jump');
            expect((state.last as Jump).destBranch.pc).to.be.equal(12);

            state = state.clone();
            evm.exec(12, state);
            expect(state.stack.top).to.be.deep.equal(new Val(BigInt('0xfffefd'), true));
            expect(state.last?.name).to.be.deep.equal('JumpDest');
            expect((state.last as JumpDest).fallBranch.pc).to.be.equal(17);

            state = state.clone();
            evm.exec(17, state);
            expect(state.last?.name).to.be.deep.equal('Stop');

            expect(evm.blocks).to.have.keys([0, 12, 17]);
            expect(evm.blocks.get(0)?.pcend).to.be.equal(8);
            expect(evm.blocks.get(12)?.pcend).to.be.equal(17);
            expect(evm.blocks.get(17)?.pcend).to.be.equal(19);

            const chunks = evm.chunks().map(({ pcbegin: pcstart, pcend, content: chunk }) => ({ pcstart, pcend, chunk }));
            expect(chunks).to.be.deep.equal([
                {
                    pcstart: 0, pcend: 8, chunk: [
                        new Opcode(0, 0x60, 'PUSH1', new Uint8Array([1])),
                        new Opcode(2, 0x60, 'PUSH1', new Uint8Array([2])),
                        new Opcode(4, 0x01, 'ADD'),
                        new Opcode(5, 0x60, 'PUSH1', new Uint8Array([12])),
                        new Opcode(7, 0x56, 'JUMP'),
                    ],
                },
                {
                    pcstart: 8, pcend: 12, chunk: new Uint8Array([1, 2, 3, 4])
                },
                {
                    pcstart: 12, pcend: 17, chunk: [
                        new Opcode(12, 0x5b, 'JUMPDEST'),
                        new Opcode(13, 0x62, 'PUSH3', new Uint8Array([255, 254, 253])),
                    ]
                },
                {
                    pcstart: 17, pcend: 19, chunk: [
                        new Opcode(17, 0x5b, 'JUMPDEST'),
                        new Opcode(18, 0x00, 'STOP'),
                    ]
                }
            ]);
        });
    });

    describe('`opcodes`', function () {
        it('should throw when `blocks` has not yet been initialized', function () {
            const evm = EVM.new('0x01');
            expect(() => evm.opcodes().filter(o => o.mnemonic === 'ADD'))
                .to.throw('`blocks` is empty, call `start`, `run` or `exec` first');
        });

        it('should return single opcode', function () {
            const evm = EVM.new('0x01');
            evm.start();
            expect(evm.errors.map(e => e.reason))
                .to.be.deep.equal(['POP with empty stack']);
            expect(evm.opcodes().filter(o => o.mnemonic === 'ADD'))
                .to.be.deep.equal([new Opcode(0, 0x1, 'ADD')]);
        });

        it('should find opcodes when exec `opcodes`', function () {
            const evm = EVM.new('0x60016002ff');
            evm.start();
            expect(evm.opcodes().filter(o => o.mnemonic === 'PUSH1')).to.be.deep.equal([
                new Opcode(0, 0x60, 'PUSH1', new Uint8Array([1])),
                new Opcode(2, 0x60, 'PUSH1', new Uint8Array([2])),
            ]);
            expect(evm.opcodes().filter(o => o.mnemonic === 'SELFDESTRUCT')).to.be.deep.equal([
                new Opcode(4, 0xff, 'SELFDESTRUCT'),
            ]);
            expect(evm.opcodes().filter(o => o.mnemonic === 'ADD')).to.be.empty;
            expect(evm.opcodes().filter(o => o.mnemonic === 'SUB')).to.be.empty;
        });

        it('should not find `selfdestruct` in `opcodes` reachable from metadata', function () {
            const SELFDESTRUCT = new Shanghai().opcodes().SELFDESTRUCT;
            const includesFF = (hash: string) => Buffer.from(hash, 'hex').includes(SELFDESTRUCT);

            const version = '0.5.5';
            const randomDataPath = path.join('.artifacts', `${this.test!.parent!.title}.${version}.data`);
            const solTemplate = `contract Test { bytes32 constant data = "[randomData]"; }`;

            let randomData, metadata, bytecode;
            try {
                randomData = fs.readFileSync(randomDataPath, 'utf8');
                const src = solTemplate.replace('[randomData]', randomData);
                bytecode = compile(src, version, this).bytecode;
                metadata = splitMetadataHash(bytecode).metadata!;
            } catch {
                do {
                    randomData = crypto.randomBytes(16).toString('hex');
                    const src = solTemplate.replace('[randomData]', randomData);
                    bytecode = compile(src, version, null).bytecode;
                    metadata = splitMetadataHash(bytecode).metadata!;
                } while (!includesFF(metadata.hash));
                fs.writeFileSync(randomDataPath, randomData);
            }

            const evm = EVM.new(bytecode);

            this.test!.title += ` (data ${randomData} | hash ${metadata.hash})`;

            expect(includesFF(metadata.hash)).to.be.true;

            evm.start();
            expect(evm.opcodes().filter(o => o.opcode === SELFDESTRUCT)).to.be.empty;
        });
    });
});
