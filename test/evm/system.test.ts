import { expect } from 'chai';
import { build, stringify } from '../../src';
import { EVM } from '../../src/evm';
import { type Expr, type Inst, Val } from '../../src/evm/expr';
import { MLoad } from '../../src/evm/memory';
import { Info, SPECIAL } from '../../src/evm/special';
import { Create, Return, SelfDestruct, Sha3, Stop, SYSTEM } from '../../src/evm/system';
import { State } from '../../src/state';
import { fnselector } from '../utils/selector';
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
        const state = new State<Inst, Expr>();
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
        const state = new State<Inst, Expr>();
        SYSTEM.STOP(state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new Stop()]);
        expect(`${state.stmts[0]}`).to.be.equal('return;');
    });

    it('should halt with SELFDESTRUCT', () => {
        const state = new State<Inst, Expr>();
        SPECIAL.ADDRESS(state);
        SYSTEM.SELFDESTRUCT(state);
        expect(state.halted).to.be.true;
        expect(state.stmts).to.be.deep.equal([new SelfDestruct(Info.ADDRESS)]);
        expect(`${state.stmts[0]}`).to.be.equal('selfdestruct(address(this));');
    });

    describe('RETURN', () => {
        it('should return with no arguments', () => {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x0n));
            state.stack.push(new Val(0x0n));
            SYSTEM.RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Return([])]);
            expect(`${state.stmts[0]}`).to.be.equal('return;');
        });

        it('should return with a single argument', () => {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x20n));
            state.stack.push(new Val(0x4n));
            SYSTEM.RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([new Return([new MLoad(new Val(0x4n))])]);
            expect(`${state.stmts[0]}`).to.be.equal('return memory[0x4];');
        });

        it('should return more than one argument', () => {
            const state = new State<Inst, Expr>();
            state.stack.push(new Val(0x30n));
            state.stack.push(new Val(0x4n));
            SYSTEM.RETURN(state);
            expect(state.halted).to.be.true;
            expect(state.stmts).to.be.deep.equal([
                new Return([new MLoad(new Val(0x4n)), new MLoad(new Val(0x24n))]),
            ]);
            expect(`${state.stmts[0]}`).to.be.equal('return (memory[0x4], memory[0x24]);');
        });

        it('should find `return`s in compiled code', function () {
            const sol = `contract C {
                function name() external pure returns (uint256) { return 7; }
                function symbol() external pure returns (uint256) { return 11; }
                function hola() external pure returns (string memory) { return "12345"; }
            }`;

            const evm = new EVM(compile(sol, '0.8.16', { context: this }).bytecode);
            evm.start();

            const selector = fnselector('name()');
            const symbolSelector = fnselector('symbol()');
            const hola = fnselector('hola()');
            expect(evm.functionBranches).to.have.keys(selector, symbolSelector, hola);

            {
                const branch = evm.functionBranches.get(selector)!;
                const ast = stringify(build(branch.state));
                expect(ast).to.be.deep.equal('return 0x7;\n');
            }
            {
                const branch = evm.functionBranches.get(symbolSelector)!;
                const ast = stringify(build(branch.state));
                expect(ast).to.be.deep.equal('return 0xb;\n');
            }
            {
                const branch = evm.functionBranches.get(hola)!;
                const ast = stringify(build(branch.state));
                expect(ast).to.be.deep.equal("return '12345';\n");
            }
        });
    });
});
