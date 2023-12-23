import { strict as assert } from 'assert';
import { expect } from 'chai';

import { EVM, State, type Ram, sol, yul, solStmts, STEP } from 'sevm';
import { Invalid, type Expr, type Inst, Throw, Stop, JumpDest, Jumpi, Jump, Props } from 'sevm/ast';

import { compile } from './utils/solc';
import { eventSelector } from './utils/selector';

describe('::evm', function () {

    it('should find opcodes when exec `containsOpcode`', function () {
        const evm = new EVM('0x60016002ff');
        expect(evm.containsOpcode('PUSH1')).to.be.true;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.true;
        expect(evm.containsOpcode('ADD')).to.be.false;
        expect(evm.containsOpcode('SUB')).to.be.false;
    });

    it('should throw in `containsOpcode` when providing invalid opcode', function () {
        const evm = new EVM('0x');
        expect(() => evm.containsOpcode('add' as keyof ReturnType<typeof STEP>['opcodes']))
            .to.throw('Provided opcode `add` is not');
        expect(() => evm.containsOpcode('haltingSteps'))
            .to.throw('Provided opcode `haltingSteps` is not');
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

        const evm = new EVM(compile(src, '0.7.6', this).bytecode, Object.setPrototypeOf({
            GASLIMIT(state: Ram<Expr>) {
                count++;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                super.GASLIMIT(state);
                gasLimit = state.stack.top;
            },
            GASPRICE(state: Ram<Expr>) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                super.GASPRICE(state);
                gasPrice = state.stack.top;
            },
        }, STEP()));

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

        const evm = new EVM(compile(src, '0.7.6', this, { enabled: true }).bytecode);
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
});
