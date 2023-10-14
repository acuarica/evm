import { keccak_256 } from '@noble/hashes/sha3';
import { strict as assert } from 'assert';
import { expect } from 'chai';

import { EVM, State, toHex } from 'sevm';
import { And, Block, Not, Val, type Expr, type Inst } from 'sevm/ast';

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
        const opcodes = new EVM(compile(src, '0.7.6', this).bytecode).opcodes;

        const selector = fnselector(sig);
        const push4 = opcodes.find(o => o.mnemonic === 'PUSH4' && toHex(o.pushData) === selector);
        expect(push4, `PUSH4 ${selector} not found`).to.be.not.undefined;
    });

    it('`keccak_256` hash selector for `supportsInterface(bytes4)`', function () {
        const sig = 'supportsInterface(bytes4)';
        const hash = toHex(keccak_256(sig).slice(0, 4));
        expect(hash).to.be.equal('01ffc9a7');
    });

    it('find type cast for `uint128` using `And`', function () {
        const src = `contract Test {
            event Deposit(uint128); 
            fallback () external payable {
                uint128 a = uint128(~block.number);
                emit Deposit(a);
            }
        }`;
        const evm = new EVM(compile(src, '0.7.6', this).bytecode);
        const state = new State<Inst, Expr>();
        evm.run(0, state);
        assert(state.stmts[0].name === 'Log');
        expect(state.stmts[0].args![0]).to.be.deep.equal(
            new And(new Val(BigInt('0x' + 'ff'.repeat(16)), true), new Not(Block.number))
        );
    });
});
