import { expect } from 'chai';
import { State } from '../../src/state';
import { type Expr, Val, type Inst } from '../../src/evm/expr';
import { Block } from '../../src/evm/special';
import { STEP } from '../../src/step';

describe('evm::memory', function () {
    it('should load values into stack', function () {
        const state = new State<Inst, Expr>();

        state.memory[4] = new Val(1n);
        state.stack.push(new Val(4n));
        STEP().MLOAD(state);

        expect(state.stack.values).to.be.deep.equal([new Val(1n)]);
    });

    it('should store values into memory', function () {
        const state = new State<Inst, Expr>();

        state.stack.push(Block.coinbase);
        state.stack.push(new Val(4n));
        STEP().MSTORE(state);

        expect(state.memory).to.be.deep.equal({ '4': Block.coinbase });
    });
});
