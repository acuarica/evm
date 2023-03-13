import { expect } from 'chai';
import { type Expr, type Stmt, Val } from '../../src/evm/ast';
import { MLoad } from '../../src/evm/memory';
import { SYM, Symbol0 } from '../../src/evm/sym';
import { Create, INVALID, Invalid, SelfDestruct, Sha3, Stop, SYSTEM } from '../../src/evm/system';
import { State } from '../../src/state';

describe('evm::system', () => {
    it('should exec `SHA3`', () => {
        const state = new State<never, Expr>();
        state.stack.push(new Val(4n));
        state.stack.push(new Val(0x10n));
        SYSTEM.SHA3(state);
        expect(state.halted).to.be.false;
        expect(state.stack.values).to.be.deep.equal([new Sha3([new MLoad(new Val(0x10n))])]);
        expect(`${state.stack.values[0]}`).to.be.equal('keccak256(memory[0x10])');
    });

    it('should exec `CREATE`', () => {
        const state = new State<Stmt, Expr>();
        state.stack.push(new Val(0x20n));
        state.stack.push(new Val(0x10n));
        state.stack.push(new Val(0x1000n));
        SYSTEM.CREATE(state);
        expect(state.halted).to.be.false;
        expect(state.stack.values).to.be.deep.equal([
            new Create(new Val(0x1000n), new Val(16n), new Val(32n)),
        ]);
        expect(`${state.stack.values[0]}`).to.be.equal(
            'new Contract(memory[0x10..0x10+0x20]).value(0x1000).address'
        );
    });

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
