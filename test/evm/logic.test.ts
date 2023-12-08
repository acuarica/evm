import { strict as assert } from 'assert';
import { expect } from 'chai';

import { EVM, State } from 'sevm';
import { type Expr, type Inst, Sig } from 'sevm/ast';

import { fnselector } from '../utils/selector';
import { compile } from '../utils/solc';

describe('evm::logic', function () {
    describe('EQ', function () {
        it('should detect EQ `balanceOf` function identifier ', function () {
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
