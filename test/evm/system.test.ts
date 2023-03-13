import { expect } from 'chai';
import type { Expr, Stmt } from '../../src/evm/ast';
import { SYSTEM } from '../../src/evm/system';
import { State } from '../../src/state';

describe('evm::system', () => {
    it('should halt with `STOP`', () => {
        const state = new State<Stmt, Expr>();
        SYSTEM.STOP(state);
        expect(state.halted).to.be.true;
    });
});
