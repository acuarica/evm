import { keccak_256 } from '@noble/hashes/sha3';
import { strict as assert } from 'assert';
import { expect } from 'chai';

import { EVM, State, stripMetadataHash, STEP } from 'sevm';
import { And, Block, Not, Val, Local, type Inst, type Expr } from 'sevm/ast';

import { fnselector } from './utils/selector';
import { compile } from './utils/solc';

describe('evm', function () {
    it('`PUSH4` method selector to invoke external contract', function () {
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
        const opcodes = new EVM(compile(src, '0.7.6', this).bytecode, STEP()).opcodes;

        const selector = fnselector(sig);
        const push4 = opcodes.find(o => o.mnemonic === 'PUSH4' && o.hexData() === selector);
        expect(push4, `PUSH4 ${selector} not found`).to.be.not.undefined;
    });

    it('`keccak_256` hash selector for `supportsInterface(bytes4)`', function () {
        const sig = 'supportsInterface(bytes4)';
        const hash = Buffer.from(keccak_256(sig).slice(0, 4)).toString('hex');
        expect(hash).to.be.equal('01ffc9a7');
    });

    it('find type cast for `uint128` using `And`', function () {
        const src = `contract Test {
            event Deposit(uint128); 
            fallback () external payable {
                emit Deposit(uint128(~block.number));
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode, STEP());
        const state = new State<Inst, Expr>();
        evm.run(0, state);

        const stmt = state.stmts.at(-2)!;
        assert(stmt.name === 'Log');
        expect(stmt.args![0]).to.be.deep.equal(
            new And(
                new Val(BigInt('0x' + 'ff'.repeat(16)), true),
                new Local(1, new Not(Block.number))
            )
        );
    });

    describe('different empty contracts should have the same bytecode', function () {
        const bytecodes = new Set<string>();
        [
            {
                title: 'with no functions',
                src: `contract Test { }`,
            },
            {
                title: 'with `internal` unused function',
                src: `contract Test {
                function get() internal pure returns (uint256) {
                    return 5;
                }
            }`,
            },
            {
                title: 'with `internal` unused function emitting an event',
                src: `contract Test {
                event Transfer(uint256, address);
                function get() internal {
                    emit Transfer(3, address(this));
                }
            }`,
            },
            {
                title: 'with a private variable and no usages',
                src: `contract Test {
                uint256 private value;
            }`,
            },
            {
                title: 'with a private variable and unreachable usages',
                src: `contract Test {
                uint256 private value;
                function setValue(uint256 newValue) internal {
                    value = newValue;
                }
            }`,
            },
        ].forEach(({ title, src }) => {
            it(title, function () {
                const step = STEP();
                const bytecode = stripMetadataHash(compile(src, '0.7.6', this).bytecode)[0];
                bytecodes.add(bytecode);
                expect(bytecodes).to.have.length(1);

                const { opcodes } = step.decode(bytecode);
                expect(opcodes.map(op => op.mnemonic)).to.be.deep.equal([
                    'PUSH1',
                    'PUSH1',
                    'MSTORE',
                    'PUSH1',
                    'DUP1',
                    'REVERT',
                    'INVALID',
                ]);
            });
        });
    });
});
