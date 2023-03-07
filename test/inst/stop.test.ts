import { expect } from 'chai';
import { State, inst } from '../../src';

describe('inst.STOP', () => {
    it('should halt', () => {
        const state = new State();
        expect(state.halted).to.be.false;
        inst.SYSTEM.STOP(state);
        expect(state.halted).to.be.true;
    });
});
