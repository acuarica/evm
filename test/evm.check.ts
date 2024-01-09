import { keccak_256 } from '@noble/hashes/sha3';
import { strict as assert } from 'assert';
import { expect } from 'chai';

import { EVM, State } from 'sevm';
import { And, Not, Val, Local, type Inst, type Expr, Props } from 'sevm/ast';

import { compile } from './utils/solc';

describe('evm', function () {
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

});
