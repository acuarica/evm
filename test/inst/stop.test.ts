import { expect } from 'chai';
import { SYSTEM } from '../../src/inst/system';
import { State } from '../../src/state';

describe('STOP', () => {
    it('should halt', () => {
        const state = new State();
        expect(state.halted).to.be.false;
        SYSTEM.STOP(state);
        expect(state.halted).to.be.true;
    });
});
