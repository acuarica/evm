import { expect } from 'chai';
import { State } from '../../src/state';
import { type Expr, Val, type Inst } from '../../src/evm/expr';
import { Info } from '../../src/evm/sym';
import { MEMORY } from '../../src/evm/memory';

describe('evm::memory', () => {
    it('should load values into stack', () => {
        const state = new State<Inst, Expr>();

        state.memory[4] = new Val(1n);
        state.stack.push(new Val(4n));
        MEMORY.MLOAD(state);

        expect(state.stack.values).to.be.deep.equal([new Val(1n)]);
    });

    it('should store values into memory', () => {
        const state = new State<Inst, Expr>();

        state.stack.push(Info.COINBASE);
        state.stack.push(new Val(4n));
        MEMORY.MSTORE(state);

        expect(state.memory).to.be.deep.equal({ '4': Info.COINBASE });
    });
});
