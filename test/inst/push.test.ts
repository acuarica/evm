import { expect } from 'chai';
import { PUSHES } from '../../src/inst/core';
import { State } from '../../src/state';

describe('PUSH', () => {
    it('should modify stack', () => {
        const one = new Uint8Array(1);
        one[0] = 1;
        const state = new State();
        PUSHES.PUSH1(one, state);
        expect(state.stack.values).to.deep.equal([1n]);
    });
});
