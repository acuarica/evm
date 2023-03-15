import { expect } from 'chai';
import { type Expr, type Stmt, Val } from '../../src/evm/ast';
import type { Jump } from '../../src/evm/flow';
import { MLoad } from '../../src/evm/memory';
import { SYM, Symbol0 } from '../../src/evm/sym';
import {
    Create,
    INVALID,
    Invalid,
    Return,
    SelfDestruct,
    Sha3,
    Stop,
    SYSTEM,
} from '../../src/evm/system';
import { State } from '../../src/state';
import { EVM, getFunctionSelector } from '../utils/evm';
import { compile } from '../utils/solc';

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

    describe('RETURN', () => {
        it('should return with no arguments', () => {
            const state = new State<Stmt, Expr>();
            state.stack.push(new Val(0x0n));
            state.stack.push(new Val(0x0n));
            SYSTEM.RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Return([])]);
            expect(`${state.stmts[0]}`).to.be.equal('return;');
        });

        it('should return with a single argument', () => {
            const state = new State<Stmt, Expr>();
            state.stack.push(new Val(0x20n));
            state.stack.push(new Val(0x4n));
            SYSTEM.RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Return([new MLoad(new Val(0x4n))])]);
            expect(`${state.stmts[0]}`).to.be.equal('return memory[0x4];');
        });

        it('should return more than one argument', () => {
            const state = new State<Stmt, Expr>();
            state.stack.push(new Val(0x30n));
            state.stack.push(new Val(0x4n));
            SYSTEM.RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Return([new MLoad(new Val(0x4n)), new MLoad(new Val(0x24n))]),
            ]);
            expect(`${state.stmts[0]}`).to.be.equal('return (memory[0x4], memory[0x24]);');
        });

        it('should return `string`', function () {
            const sol = `contract C {
                function name() external pure returns (uint256) {
                    return 7;
                }

                function symbol() external pure returns (uint256) {
                    return 11;
                }
            }`;

            const evm = EVM(compile(sol, '0.7.6', { context: this }).deployedBytecode);

            let state = new State<Stmt, Expr>();
            evm.run(0, state);

            const selector = getFunctionSelector('name()');
            const symbolSelector = getFunctionSelector('symbol()');
            expect(evm.functionBranches).to.have.keys(selector, symbolSelector);

            const branch = evm.functionBranches.get(selector)!;
            evm.run(branch.pc, branch.state);
            state = branch.state;
            state = (state.last as Jump).destBranch.state;
            state = (state.last as Jump).destBranch.state;

            expect(state.last).to.be.deep.equal(new Return([new Val(7n)]));
            expect(`${state.last}`).to.be.equal('return 0x7;');
        });
    });
});
