import { expect } from 'chai';
import type { Expr, Stmt } from '../../src/evm/ast';
import { Stop, SYSTEM } from '../../src/evm/system';
import { State } from '../../src/state';

describe('evm::system', () => {
    it('should halt with `STOP`', () => {
        const state = new State<Stmt, Expr>();
        SYSTEM.STOP(state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new Stop()]);
        expect(`${state.stmts[0]}`).to.be.equal('return;');
    });
});
