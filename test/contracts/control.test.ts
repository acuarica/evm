import { expect } from 'chai';
import { Jump, JumpDest, Jumpi, Stop } from '../../src/ast';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('control', (compile, fallback) => {
    describe('conditional', function () {
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

            const entry = cfg.blocks[cfg.entry];
            expect(entry.preds).to.have.length(0);
            expect(entry.last).to.be.instanceOf(Jumpi);
            expect((<Jumpi>entry.last).condition.toString()).to.be.equal('block.number != 8');

            const then = cfg.blocks[(<Jumpi>entry.last).fallBranch.key];
            expect(then.preds).to.have.length(1);
            expect(then.last).to.be.instanceOf(JumpDest);

            const exit = cfg.blocks[(<Jumpi>entry.last).destBranch.key];
            expect(exit.preds).to.have.length(2);
            expect(exit.last).to.be.instanceOf(Stop);

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
    });

    describe('loop', () => {
        it('should `decompile` contract with `for` loop', function () {
            const CONTRACT = `contract Contract {
                uint256 total = 0;
                ${fallback}() external payable {
                    uint256 sum = 0xa;
                    for (uint256 i = 9; i < block.number; i++) {
                        sum += i;
                    }

                    total = sum;
                }
            }`;

            const evm = new EVM(compile(CONTRACT, this).deployedBytecode);

            const text = evm.decompile();
            expect(text, text).to.match(/block\.number/);
        });

        it('should `decompile` contract with `while` loop', function () {
            const CONTRACT = `contract Contract {
                function loop(uint256 n) external pure returns (uint256) {
                    uint256 sum = 0;
                    uint256 i = 0;
                    while (i < n) {
                        sum += i;
                        i++;
                    }
                    return sum;
                }
            }`;
            const evm = new EVM(compile(CONTRACT, this).deployedBytecode);
            evm.contract;
        });

        it('non-terminating `while` loop', function () {
            const CONTRACT = `contract Contract {
                function loop() external pure returns (uint256) {
                    uint256 sum = 0;
                    uint256 i = 0;
                    while (true) {
                        sum += i;
                        i++;
                    }
                    return sum;
                }
            }`;
            const evm = new EVM(compile(CONTRACT, this).deployedBytecode);
            evm.contract;
        });

        it('`for` with if-else', function () {
            const CONTRACT = `contract Contract {
                ${fallback}() external payable {
                    uint256 sum = 0;
                    for (uint256 i = 9; i < block.number; i++) {
                        if (i == 300) {
                            sum += 3;
                        }
                        // else {
                            sum += 7;
                        // }
                    }
                    sum += 5;
                }
            }`;
            const evm = new EVM(compile(CONTRACT, this).deployedBytecode);
            evm.contract;
        });
    });
});
