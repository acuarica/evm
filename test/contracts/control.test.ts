import { expect } from 'chai';
import { Jump, JumpDest, Jumpi, Stop } from '../../src/ast';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('control', (compile, fallback) => {
    it('should `decompile` contract with `if` no-else', function () {
        const CONTRACT = `contract C {
            uint256 total = 7;
            ${fallback}() external payable {
                // uint256 val = 0;
                if (block.number == 8) {
                    total = 3;
                }
                total += 5;
            }
        }`;
        const evm = new EVM(compile(CONTRACT, this).deployedBytecode);
        const cfg = evm.contract.main.cfg;

        expect(cfg.functionBranches).to.have.length(0);

        expect(Object.keys(cfg.blocks)).to.have.length(3);
        // expect(Object.keys(cfg.doms)).to.have.length(3);

        const entry = cfg.blocks[cfg.entry];
        expect(entry.preds).to.have.length(0);
        expect(entry.last).to.be.instanceOf(Jumpi);
        expect((<Jumpi>entry.last).condition.toString()).to.be.equal('block.number != 8');

        {
            const then = cfg.blocks[(<Jumpi>entry.last).fallBranch.key];
            expect(then.preds).to.have.length(1);
            expect(then.last).to.be.instanceOf(JumpDest);
        }

        {
            const exit = cfg.blocks[(<Jumpi>entry.last).destBranch.key];
            expect(exit.preds).to.have.length(2);
            expect(exit.last).to.be.instanceOf(Stop);
        }

        const text = evm.decompile();
        expect(text, text).to.match(/block\.number/);
        expect(text, `decompiled bytecode\n${text}`).to.match(/block\.number/);
    });

    it('should `decompile` contract with `if-else`', function () {
        const CONTRACT = `contract C {
            uint256 total = 7;
            ${fallback}() external payable {
                if (block.number == 8) {
                    total = 3;
                } else {
                    total = 7;
                }
                total += 5;
            }
        }`;
        const evm = new EVM(compile(CONTRACT, this).deployedBytecode);
        const cfg = evm.contract.main.cfg;

        expect(cfg.functionBranches).to.have.length(0);

        expect(Object.keys(cfg.blocks)).to.have.length(4);

        const entry = cfg.blocks[cfg.entry];
        expect(entry.preds).to.have.length(0);
        expect(entry.last).to.be.instanceOf(Jumpi);
        expect((<Jumpi>entry.last).condition.toString()).to.be.equal('block.number != 8');

        const trueBranch = cfg.blocks[(<Jumpi>entry.last).destBranch.key];
        expect(trueBranch.preds).to.have.length(1);
        expect(trueBranch.last).to.be.instanceOf(JumpDest);

        const falseBranch = cfg.blocks[(<Jumpi>entry.last).fallBranch.key];
        expect(falseBranch.preds).to.have.length(1);
        expect(falseBranch.last).to.be.instanceOf(Jump);

        expect((<JumpDest>trueBranch.last).fallBranch.key).to.be.equal(
            (<Jump>falseBranch.last).destBranch.key
        );

        const exit = cfg.blocks[(<Jump>falseBranch.last).destBranch.key];
        expect(exit.last).to.be.instanceOf(Stop);

        const text = evm.decompile();
        expect(text, text).to.match(/block\.number/);
        expect(text, `decompiled bytecode\n${text}`).to.match(/block\.number/);
    });

    it('should `decompile` contract with nested `if` no-else', function () {
        const CONTRACT = `contract C {
            uint256 total = 7;
            ${fallback}() external payable {
                // uint256 val = 0;
                if (block.number == 8) {
                    uint256 x = total;
                    x += 11;
                    if (block.number == 9) {
                        total = 3;
                    }
                }
                total += 5;
            }
        }`;
        const evm = new EVM(compile(CONTRACT, this).deployedBytecode);
        const cfg = evm.contract.main.cfg;

        expect(cfg.functionBranches).to.have.length(0);

        expect(Object.keys(cfg.blocks)).to.have.length(5);

        const entry = cfg.blocks[cfg.entry];
        expect(entry.preds).to.have.length(0);
        expect(entry.last).to.be.instanceOf(Jumpi);
        expect((<Jumpi>entry.last).condition.toString()).to.be.equal('block.number != 8');

        const text = evm.decompile();
        expect(text, text).to.match(/block\.number/);
        expect(text, `decompiled bytecode\n${text}`).to.match(/block\.number/);
    });

    it('should `decompile` contract with `require`s', () => {
        const CONTRACT = `contract C {
            mapping (address => uint256) private _allowances;
            function approve(uint256 amount) external {
                _approve(msg.sender, amount);
            }
            function _approve(address owner, uint256 amount) private {
                require(owner != address(0), "approve");
                require(amount > 0, "approve address");
                _allowances[owner] = amount;
            }

        }`;
        const evm = new EVM(compile(CONTRACT).deployedBytecode);

        const text = evm.decompile();
        expect(text, text).to.match(/require(\()+msg.sender/);
        expect(text, text).to.match(/require\(\(_arg0 > 0\), /);
    });
});
