import { strict as assert } from 'assert';
import { expect } from 'chai';
import { State, STEP } from 'sevm';
import { EVM } from '../../src/evm';
import { type Expr, Val, type Inst } from '../../src/evm/expr';
import { Not, Shr, Sig } from '../../src/evm/logic';
import { Div } from '../../src/evm/math';
import { Block, CallDataLoad } from '../../src/evm/special';
import { fnselector } from '../utils/selector';
import { compile } from '../utils/solc';

describe('evm::logic', function () {
    [[0n, '0x' + 'ff'.repeat(32)] as const, [1n, '0x' + 'ff'.repeat(31) + 'fe'] as const].forEach(
        ([value, expected]) => {
            it(`should calculate \`~${value}\``, function () {
                const state = new State<never, Expr>();
                state.stack.push(new Val(value));
                STEP().NOT(state);
                expect(state.stack.values).to.deep.equal([new Not(new Val(value))]);
                expect(state.stack.values[0].eval()).to.be.deep.equal(new Val(BigInt(expected)));
                expect(`${state.stack.values[0].eval()}`).to.be.equal(expected);
            });
        }
    );

    it('should stringify `~block.number`', function () {
        const state = new State<never, Expr>();
        state.stack.push(Block.number);
        expect(state.stack.values).to.be.deep.equal([Block.number]);

        STEP().NOT(state);

        expect(state.stack.values).has.length(1);
        expect(state.stack.values[0]).to.be.deep.equal(new Not(Block.number));
        expect(state.stack.values[0].str()).to.be.equal('~block.number');
    });

    describe('EQ', function () {
        it('should calculate `1 == 1`', function () {
            const state = new State<never, Expr>();
            state.stack.push(new Val(1n));
            state.stack.push(new Val(1n));
            STEP().EQ(state);
            expect(state.stack.values).to.deep.equal([new Val(1n)]);
        });

        it('should calculate `1 == 2`', function () {
            const state = new State<never, Expr>();
            state.stack.push(new Val(1n));
            state.stack.push(new Val(2n));
            STEP().EQ(state);
            expect(state.stack.values).to.be.deep.equal([new Val(0n)]);
        });

        it('should stringify `block.number == 1`', function () {
            const state = new State<never, Expr>();
            state.stack.push(new Val(1n));
            state.stack.push(Block.number);
            expect(state.stack.values).to.be.deep.equal([Block.number, new Val(1n)]);

            STEP().EQ(state);

            expect(state.stack.values).has.length(1);
            expect(state.stack.values[0].str()).to.be.equal('block.number == 0x1');
        });

        ['06fdde03', '12345678', '00000001'].forEach(selector => {
            describe(`EQ detect msg.sig for hash ${selector}`, function () {
                it('should stringify signature `msg.sig` from RHS DIV&EXP', function () {
                    const state = new State<never, Expr>();
                    state.stack.push(new Div(new CallDataLoad(new Val(0n)), new Val(2n ** 0xe0n)));
                    state.stack.push(new Val(BigInt('0x' + selector)));
                    STEP().EQ(state);

                    expect(state.stack.values).has.length(1);
                    expect(state.stack.values[0].str()).to.equal(`msg.sig == ${selector}`);
                });

                it('should stringify signature `msg.sig` from LHS DIV&EXP', function () {
                    const state = new State<never, Expr>();
                    state.stack.push(new Val(BigInt('0x' + selector)));
                    state.stack.push(new Div(new CallDataLoad(new Val(0n)), new Val(2n ** 0xe0n)));
                    STEP().EQ(state);

                    expect(state.stack.values).has.length(1);
                    expect(state.stack.values[0].str()).to.be.equal(`msg.sig == ${selector}`);
                });

                it('should stringify signature `msg.sig` from RHS SHR', function () {
                    const state = new State<never, Expr>();
                    state.stack.push(new Shr(new CallDataLoad(new Val(0n)), new Val(0xe0n)));
                    state.stack.push(new Val(BigInt('0x' + selector)));
                    STEP().EQ(state);

                    expect(state.stack.values).has.length(1);
                    expect(state.stack.values[0].str()).to.be.equal(`msg.sig == ${selector}`);
                });

                it('should stringify signature `msg.sig` from LHS SHR', function () {
                    const state = new State<never, Expr>();
                    state.stack.push(new Val(BigInt('0x' + selector)));
                    state.stack.push(new Shr(new CallDataLoad(new Val(0n)), new Val(0xe0n)));
                    STEP().EQ(state);

                    expect(state.stack.values).has.length(1);
                    expect(state.stack.values[0].str()).to.be.equal(`msg.sig == ${selector}`);
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
