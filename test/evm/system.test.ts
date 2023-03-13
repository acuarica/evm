import { expect } from 'chai';
import type { Expr, Stmt } from '../../src/evm/ast';
import { SYM, Symbol0 } from '../../src/evm/sym';
import { INVALID, Invalid, SelfDestruct, Stop, SYSTEM } from '../../src/evm/system';
import { State } from '../../src/state';

describe('evm::system', () => {
    it('should halt with STOP', () => {
        const state = new State<Stmt, Expr>();
        SYSTEM.STOP(state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new Stop()]);
        expect(`${state.stmts[0]}`).to.be.equal('return;');
    });

    it('should halt with SELFDESTRUCT', () => {
        const state = new State<Stmt, Expr>();
        SYM.ADDRESS(state);
        SYSTEM.SELFDESTRUCT(state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new SelfDestruct(new Symbol0('this'))]);
        expect(`${state.stmts[0]}`).to.be.equal('selfdestruct(this);');
    });

    it('should halt with `INVALID`', () => {
        const state = new State<Stmt, Expr>();
        INVALID({ offset: 0, pc: 0, opcode: 1, mnemonic: 'INVALID', pushData: null }, state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new Invalid(1)]);
        expect(`${state.stmts[0]}`).to.be.equal('revert("Invalid instruction (0x1)");');
    });
});
