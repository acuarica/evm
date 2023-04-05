import assert = require('assert');
import { expect } from 'chai';
import { EVM } from '../../src/evm';
import { type Expr, Val, type Inst } from '../../src/evm/expr';
import { CallDataLoad } from '../../src/evm/env';
import { LOGIC, Not, Shr, Sig } from '../../src/evm/logic';
import { Div } from '../../src/evm/math';
import { Block } from '../../src/evm/sym';
import { Stack, State } from '../../src/state';
import { fnselector } from '../utils/selector';
import { compile } from '../utils/solc';

describe('evm::logic', () => {
    [[0n, '0x' + 'ff'.repeat(32)] as const, [1n, '0x' + 'ff'.repeat(31) + 'fe'] as const].forEach(
        ([value, expected]) => {
            it(`should calculate \`~${value}\``, () => {
                const stack = new Stack<Expr>();
                stack.push(new Val(value));
                LOGIC.NOT(stack);
                expect(stack.values).to.deep.equal([new Not(new Val(value))]);
                expect(stack.values[0].eval()).to.be.deep.equal(new Val(BigInt(expected)));
                expect(`${stack.values[0].eval()}`).to.be.equal(expected);
            });
        }
    );

    it('should stringify `~block.number`', () => {
        const stack = new Stack<Expr>();
        stack.push(Block.number);
        expect(stack.values).to.be.deep.equal([Block.number]);

        LOGIC.NOT(stack);

        expect(stack.values).has.length(1);
        expect(stack.values[0]).to.be.deep.equal(new Not(Block.number));
        expect(stack.values[0].str()).to.be.equal('~block.number');
    });

    describe('EQ', () => {
        it('should calculate `1 == 1`', () => {
            const stack = new Stack<Expr>();
            stack.push(new Val(1n));
            stack.push(new Val(1n));
            LOGIC.EQ(stack);
            expect(stack.values).to.deep.equal([new Val(1n)]);
        });

        it('should calculate `1 == 2`', () => {
            const stack = new Stack<Expr>();
            stack.push(new Val(1n));
            stack.push(new Val(2n));
            LOGIC.EQ(stack);
            expect(stack.values).to.be.deep.equal([new Val(0n)]);
        });

        it('should stringify `block.number == 1`', () => {
            const stack = new Stack<Expr>();
            stack.push(new Val(1n));
            stack.push(Block.number);
            expect(stack.values).to.be.deep.equal([Block.number, new Val(1n)]);

            LOGIC.EQ(stack);

            expect(stack.values).has.length(1);
            expect(stack.values[0].str()).to.be.equal('block.number == 0x1');
        });

        ['06fdde03', '12345678', '00000001'].forEach(selector => {
            describe(`EQ detect msg.sig for hash ${selector}`, () => {
                it('should stringify signature `msg.sig` from RHS DIV&EXP', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Div(new CallDataLoad(new Val(0n)), new Val(2n ** 0xe0n)));
                    stack.push(new Val(BigInt('0x' + selector)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.equal(`msg.sig == ${selector}`);
                });

                it('should stringify signature `msg.sig` from LHS DIV&EXP', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Val(BigInt('0x' + selector)));
                    stack.push(new Div(new CallDataLoad(new Val(0n)), new Val(2n ** 0xe0n)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.be.equal(`msg.sig == ${selector}`);
                });

                it('should stringify signature `msg.sig` from RHS SHR', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Shr(new CallDataLoad(new Val(0n)), new Val(0xe0n)));
                    stack.push(new Val(BigInt('0x' + selector)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.be.equal(`msg.sig == ${selector}`);
                });

                it('should stringify signature `msg.sig` from LHS SHR', () => {
                    const stack = new Stack<Expr>();
                    stack.push(new Val(BigInt('0x' + selector)));
                    stack.push(new Shr(new CallDataLoad(new Val(0n)), new Val(0xe0n)));
                    LOGIC.EQ(stack);

                    expect(stack.values).has.length(1);
                    expect(stack.values[0].str()).to.be.equal(`msg.sig == ${selector}`);
                });
            });
        });

        it('should detect EQ `balanceOf` function identifier ', function () {
            const balanceOf = 'balanceOf(address addr)';
            const selector = fnselector(balanceOf);
            const sol = `contract C {
                function ${balanceOf} external payable returns (address) {
                    return addr;
                }
            }`;

            const evm = new EVM(compile(sol, '0.7.6', { context: this }).bytecode);

            const state = new State<Inst, Expr>();
            evm.run(0, state);

            assert(state.last!.name === 'Jumpi');
            assert(state.last.fallBranch.state.last?.name === 'SigCase');
            expect(state.last.fallBranch.state.last?.condition).to.be.deep.equal(new Sig(selector));
        });
    });
});
