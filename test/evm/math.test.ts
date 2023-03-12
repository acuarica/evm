import { expect } from 'chai';
import { Stack } from '../../src/state';
import { Add, Div, Exp, MATH, Mul, Sub } from '../../src/evm/math';
import { type Expr, Val } from '../../src/evm/def';
import { SYM, Symbol0 } from '../../src/evm/sym';

describe('evm::math::', () => {
    it('should test `isVal`', () => {
        expect(new Val(0n).isVal()).to.be.true;
        expect(new Add(new Val(1n), new Val(2n)).isVal()).to.be.false;
    });

    it('should test `isZero`', () => {
        expect(new Val(0n).isZero()).to.be.true;
        expect(new Val(1n).isZero()).to.be.false;
    });

    [
        {
            insts: ['NUMBER', 1, 'ADD'] as const,
            expr: new Add(new Val(1n), new Symbol0('block.number')),
            get val() {
                return this.expr;
            },
            str: '1 + block.number',
        },
        {
            insts: [2, 1, 'ADD'] as const,
            expr: new Add(new Val(1n), new Val(2n)),
            val: new Val(3n),
            str: '1 + 2',
        },
        {
            insts: [2, 1, 'SUB'] as const,
            expr: new Sub(new Val(1n), new Val(2n)),
            val: new Val(-1n),
            str: '1 - 2',
        },
        {
            insts: [3, 2, 'ADD', 1, 'ADD'] as const,
            expr: new Add(new Val(1n), new Add(new Val(2n), new Val(3n))),
            val: new Val(6n),
            str: '1 + 2 + 3',
        },
        {
            insts: [3, 5, 'ADD', 2, 'MUL'] as const,
            expr: new Mul(new Val(2n), new Add(new Val(5n), new Val(3n))),
            val: new Val(16n),
            str: '2 * (5 + 3)',
        },
        {
            insts: [3, 5, 'MUL', 2, 'ADD'] as const,
            expr: new Add(new Val(2n), new Mul(new Val(5n), new Val(3n))),
            val: new Val(17n),
            str: '2 + 5 * 3',
        },
        {
            insts: [3, 4, 'ADD', 7, 'SUB'] as const,
            expr: new Sub(new Val(7n), new Add(new Val(4n), new Val(3n))),
            val: new Val(0n),
            str: '7 - 4 + 3',
        },
        {
            insts: [3, 5, 'ADD', 2, 'DIV'] as const,
            expr: new Div(new Val(2n), new Add(new Val(5n), new Val(3n))),
            val: new Val(0n),
            str: '2 / (5 + 3)',
        },
        {
            insts: [3, 5, 'DIV', 2, 'ADD'] as const,
            expr: new Add(new Val(2n), new Div(new Val(5n), new Val(3n))),
            val: new Val(3n),
            str: '2 + 5 / 3',
        },
        {
            insts: [2, 3, 'EXP', 1, 'ADD'] as const,
            expr: new Add(new Val(1n), new Exp(new Val(3n), new Val(2n))),
            val: new Val(10n),
            str: '1 + 3 ** 2',
        },
        {
            insts: [3, 1, 'ADD', 2, 'EXP'] as const,
            expr: new Exp(new Val(2n), new Add(new Val(1n), new Val(3n))),
            val: new Val(16n),
            str: '2 ** (1 + 3)',
        },
    ].forEach(
        ({
            insts,
            expr,
            val,
            str,
        }: {
            insts: readonly (keyof typeof MATH | keyof typeof SYM | number)[];
            expr: Expr;
            val: Expr;
            str: string;
        }) => {
            it(`should \`eval+str\` \`${str}\``, () => {
                const stack = new Stack<Expr>();
                for (const inst of insts) {
                    if (typeof inst === 'number') {
                        stack.push(new Val(BigInt(inst)));
                    } else {
                        const sym = Object.fromEntries(
                            Object.entries(SYM).map(([k, fn]) => [
                                k,
                                (stack: Stack<Expr>) => fn({ stack, memory: {} }),
                            ])
                        ) as { [key in keyof typeof SYM]: (stack: Stack<Expr>) => void };
                        const evm = { ...MATH, ...sym };
                        evm[inst](stack);
                    }
                }

                expect(stack.values).to.be.deep.equal([expr]);
                expect(expr.eval()).to.be.deep.equal(val);
                expect(expr.str()).to.be.equal(str);
            });
        }
    );
});
