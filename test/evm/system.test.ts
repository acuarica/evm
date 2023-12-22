import { expect } from 'chai';

import { EVM, STEP, State, build, sol, solStmts } from 'sevm';
import type { Expr, Inst } from 'sevm/ast';

import { fnselector } from '../utils/selector';
import { compile } from '../utils/solc';

describe('evm::system', function () {

    it('should find `RETURN` in bytecode', function () {
        const src = `contract Test { 
            function name() external pure returns (uint256) { return 7; }
            function symbol() external pure returns (uint256) { return 11; }
            function hola() external pure returns (string memory) { return "12345"; }
        }`;

        const evm = new EVM(
            compile(src, '0.8.16', this, {
                enabled: true,
                details: { jumpdestRemover: true },
            }).bytecode
        );
        evm.start();

        const selector = fnselector('name()');
        const symbolSelector = fnselector('symbol()');
        const hola = fnselector('hola()');
        expect(evm.step.functionBranches).to.have.keys(selector, symbolSelector, hola);

        {
            const branch = evm.step.functionBranches.get(selector)!;
            const ast = build(branch.state);
            expect(solStmts(ast)).to.be.deep.equal('return 0x7;\n');
        }
        {
            const branch = evm.step.functionBranches.get(symbolSelector)!;
            const ast = solStmts(build(branch.state));
            expect(ast).to.be.deep.equal('return 0xb;\n');
        }
        {
            const branch = evm.step.functionBranches.get(hola)!;
            const ast = solStmts(build(branch.state));
            expect(ast.trim().split('\n').at(-1)).to.be.deep.equal("return '12345';");
        }
    });

    it('should stringify CREATE', function () {
        const src = `
            contract Token { }
            contract Test {
                fallback() external payable {
                    new Token();
                }
            }`;

        const evm = new EVM(compile(src, '0.8.16', this, { enabled: true }).bytecode, STEP());
        const state = new State<Inst, Expr>();
        evm.run(0, state);
        const stmts = build(state);
        expect(sol`${stmts[6]}`).to.be.deep.equal(
            'require(new Contract(memory[0x80..0x80+0x5c + 0x80 - 0x80]).value(0x0).address);'
        );
        expect(sol`${stmts[7]}`).to.be.deep.equal('return;');
    });
});
