import { expect } from 'chai';

import { EVM, STEP, State, build, sol, solStmts } from 'sevm';
import type { Expr, Inst } from 'sevm/ast';
import { Add, Create, Info, MLoad, Return, SelfDestruct, Sha3, Stop, Val } from 'sevm/ast';

import { fnselector } from '../utils/selector';
import { compile } from '../utils/solc';

describe('evm::system', function () {
    it('should exec `SHA3`', function () {
        const state = new State<never, Expr>();
        state.stack.push(new Val(4n));
        state.stack.push(new Val(0x10n));
        STEP().SHA3(state);
        expect(state.halted).to.be.false;
        expect(state.stack.values).to.be.deep.equal([
            new Sha3(new Val(0x10n), new Val(4n), [new MLoad(new Val(0x10n))]),
        ]);
        expect(sol`${state.stack.values[0]}`).to.be.equal('keccak256(memory[0x10])');
    });

    it('should exec `CREATE`', function () {
        const state = new State<Inst, Expr>();
        state.stack.push(new Val(0x20n));
        state.stack.push(new Val(0x10n));
        state.stack.push(new Val(0x1000n));
        STEP().CREATE(state);
        expect(state.halted).to.be.false;
        expect(state.stack.values).to.be.deep.equal([
            new Create(new Val(0x1000n), new Val(16n), new Val(32n)),
        ]);
        expect(sol`${state.stack.values[0]}`).to.be.equal(
            'new Contract(memory[0x10..0x10+0x20]).value(0x1000).address'
        );
    });

    it('should halt with STOP', function () {
        const state = new State<Inst, Expr>();
        STEP().STOP(state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new Stop()]);
        expect(sol`${state.stmts[0]}`).to.be.equal('return;');
    });

    it('should halt with SELFDESTRUCT', function () {
        const state = new State<Inst, Expr>();
        STEP().ADDRESS(state);
        STEP().SELFDESTRUCT(state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new SelfDestruct(Info.ADDRESS)]);
        expect(sol`${state.stmts[0]}`).to.be.equal('selfdestruct(address(this));');
    });

    describe('RETURN', function () {
        it('should return with no arguments', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x0n));
            state.stack.push(new Val(0x0n));
            STEP().RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Return(new Val(0n), new Val(0n), [])]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return;');
        });

        it('should return with a single argument', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x20n));
            state.stack.push(new Val(0x4n));
            STEP().RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Return(new Val(0x4n), new Val(0x20n), [new MLoad(new Val(0x4n))]),
            ]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return memory[0x4];');
        });

        it('should return more than one argument', function () {
            const state = new State<Inst, Expr>();
            state.stack.push(new Add(new Val(0x20n), new Val(0x10n)));
            state.stack.push(new Val(0x4n));
            STEP().RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Return(new Val(0x4n), new Add(new Val(0x20n), new Val(0x10n)), [
                    new MLoad(new Val(0x4n)),
                    new MLoad(new Val(0x24n)),
                ]),
            ]);
            expect(sol`${state.stmts[0]}`).to.be.equal('return (memory[0x4], memory[0x24]);');
        });

        it('should find `return`s in compiled code', function () {
            const sol = `contract C {
                function name() external pure returns (uint256) { return 7; }
                function symbol() external pure returns (uint256) { return 11; }
                function hola() external pure returns (string memory) { return "12345"; }
            }`;

            const evm = new EVM(compile(sol, '0.8.16', this).bytecode);
            evm.start();

            const selector = fnselector('name()');
            const symbolSelector = fnselector('symbol()');
            const hola = fnselector('hola()');
            expect(evm.functionBranches).to.have.keys(selector, symbolSelector, hola);

            {
                const branch = evm.functionBranches.get(selector)!;
                const ast = solStmts(build(branch.state));
                expect(ast).to.be.deep.equal('return 0x7;\n');
            }
            {
                const branch = evm.functionBranches.get(symbolSelector)!;
                const ast = solStmts(build(branch.state));
                expect(ast).to.be.deep.equal('return 0xb;\n');
            }
            {
                const branch = evm.functionBranches.get(hola)!;
                const ast = solStmts(build(branch.state));
                expect(ast).to.be.deep.equal("return '12345';\n");
            }
        });
    });
});
