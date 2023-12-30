import { expect } from 'chai';

import { Contract, EVM, London, type Ram, Shanghai, State, build, sol, solStmts } from 'sevm';
import type { Create, DataCopy, Expr, Inst } from 'sevm/ast';

import { fnselector } from '../utils/selector';
import { compile } from '../utils/solc';

describe('evm::system', function () {

    it('should find `RETURN` in bytecode', function () {
        const src = `contract Test { 
            function name() external pure returns (uint256) { return 7; }
            function symbol() external pure returns (uint256) { return 11; }
            function hola() external pure returns (string memory) { return "12345"; }
        }`;

        const evm = EVM.new(compile(src, '0.8.16', this, {
            optimizer: {
                enabled: true, details: { jumpdestRemover: true },
            }
        }).bytecode);
        evm.start();

        const selector = fnselector('name()');
        const symbolSelector = fnselector('symbol()');
        const hola = fnselector('hola()');
        expect(evm.step.functionBranches).to.have.keys(selector, symbolSelector, hola);

        const ast = (selector: string) => build(evm.step.functionBranches.get(selector)!.state);

        expect(solStmts(ast(selector))).to.be.deep.equal('return 0x7;\n');
        expect(solStmts(ast(symbolSelector))).to.be.deep.equal('return 0xb;\n');
        expect(solStmts(ast(hola)).trim().split('\n').at(-1)).to.be.deep.equal("return '12345';");
    });

    it('should stringify CREATE', function () {
        const depositEvent = 'Deposit(uint256)';
        const src = `
            contract Token {
                event ${depositEvent};
                fallback() external payable {
                    emit Deposit(3);
                }
            }

            contract Test {
                fallback() external payable {
                    new Token();
                }
            }`;

        // let create;
        const step = new class extends Shanghai {
            override CREATE = (state: State<Inst, Expr>) => {
                super.CREATE(state);
                const code = (state.stack.top as Create).bytecode!;
                const bytecode = Buffer.from(code).toString('hex');
                console.log(EVM.new(bytecode).metadata);
                console.log(new Contract(bytecode).solidify());

                new EVM(bytecode, new class extends London {
                    override CODECOPY = ({ stack, memory }: Ram<Expr>, _: unknown, bytecode: Uint8Array) => {
                        const dest = stack.top?.eval();
                        super.CODECOPY({ stack, memory }, _, bytecode);

                        if (dest?.isVal()) {
                            const m = memory[Number(dest.val)] as DataCopy;
                            console.log(new Contract(Buffer.from(m.bytecode!).toString('hex')).solidify());
                        }
                    };
                }()).start();
            };
        }();

        console.log(new Contract(compile(src, '0.8.16', this, { optimizer: { enabled: true } }).bytecode, step).solidify());

        const evm = new EVM(compile(src, '0.8.16', this, { optimizer: { enabled: true } }).bytecode, step);
        const state = new State<Inst, Expr>();
        evm.run(0, state);
        const stmts = build(state);
        expect(sol`${stmts[6]}`).to.be.deep.equal(
            'require(new Contract(memory[0x80..0x80+0x85 + 0x80 - 0x80]).value(0x0).address);'
        );
        expect(sol`${stmts[7]}`).to.be.deep.equal('return;');
    });
});
