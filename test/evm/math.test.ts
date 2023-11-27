import { expect } from 'chai';

import { sol, State, STEP } from 'sevm';
import { Add, Block, Div, Exp, Mul, Sub, Val, type Expr, Mod } from 'sevm/ast';

describe('evm::math', function () {
    it('should test `isVal`', function () {
        expect(new Val(0n).isVal()).to.be.true;
        expect(new Add(new Val(1n), new Val(2n)).isVal()).to.be.false;
    });

    it('should test `isZero`', function () {
        expect(new Val(0n).isZero()).to.be.true;
        expect(new Val(1n).isZero()).to.be.false;
    });

    [
        {
            insts: ['NUMBER', 15, 'ADD'] as const,
            expr: new Add(new Val(15n), Block.number),
            get val() {
                return this.expr;
            },
            str: '0xf + block.number',
        },
        {
            insts: [2, 1, 'ADD'] as const,
            expr: new Add(new Val(1n), new Val(2n)),
            val: new Val(3n),
            str: '0x1 + 0x2',
        },
        {
            insts: [2, 1, 'SUB'] as const,
            expr: new Sub(new Val(1n), new Val(2n)),
            val: new Val(-1n),
            str: '0x1 - 0x2',
        },
        {
            insts: [3, 2, 'ADD', 1, 'ADD'] as const,
            expr: new Add(new Val(1n), new Add(new Val(2n), new Val(3n))),
            val: new Val(6n),
            str: '0x1 + 0x2 + 0x3',
        },
        {
            insts: [3, 5, 'ADD', 2, 'MUL'] as const,
            expr: new Mul(new Val(2n), new Add(new Val(5n), new Val(3n))),
            val: new Val(16n),
            str: '0x2 * (0x5 + 0x3)',
        },
        {
            insts: [3, 5, 'MUL', 2, 'ADD'] as const,
            expr: new Add(new Val(2n), new Mul(new Val(5n), new Val(3n))),
            val: new Val(17n),
            str: '0x2 + 0x5 * 0x3',
        },
        {
            insts: [7, 3, 4, 'ADD', 'SUB'] as const,
            expr: new Sub(new Add(new Val(4n), new Val(3n)), new Val(7n)),
            val: new Val(0n),
            str: '0x4 + 0x3 - 0x7',
        },
        {
            insts: [3, 4, 'ADD', 7, 'SUB'] as const,
            expr: new Sub(new Val(7n), new Add(new Val(4n), new Val(3n))),
            val: new Val(0n),
            str: '0x7 - 0x4 + 0x3',
        },
        {
            insts: [3, 5, 'ADD', 2, 'DIV'] as const,
            expr: new Div(new Val(2n), new Add(new Val(5n), new Val(3n))),
            val: new Val(0n),
            str: '0x2 / (0x5 + 0x3)',
        },
        {
            insts: [3, 5, 'DIV', 2, 'ADD'] as const,
            expr: new Add(new Val(2n), new Div(new Val(5n), new Val(3n))),
            val: new Val(3n),
            str: '0x2 + 0x5 / 0x3',
        },
        {
            insts: [0, 3, 'DIV'] as const,
            expr: new Div(new Val(3n), new Val(0n)),
            val: new Div(new Val(3n), new Val(0n)),
            str: '0x3 / 0x0',
        },
        {
            insts: [2, 3, 'EXP', 1, 'ADD'] as const,
            expr: new Add(new Val(1n), new Exp(new Val(3n), new Val(2n))),
            val: new Val(10n),
            str: '0x1 + 0x3 ** 0x2',
        },
        {
            insts: [3, 1, 'ADD', 2, 'EXP'] as const,
            expr: new Exp(new Val(2n), new Add(new Val(1n), new Val(3n))),
            val: new Val(16n),
            str: '0x2 ** (0x1 + 0x3)',
        },
        {
            insts: [2, 5, 'MOD'] as const,
            expr: new Mod(new Val(5n), new Val(2n)),
            val: new Val(1n),
            str: '0x5 % 0x2',
        },
        {
            insts: [0, 5, 'MOD'] as const,
            expr: new Mod(new Val(5n), new Val(0n)),
            get val() {
                return this.expr;
            },
            str: '0x5 % 0x0',
        },
    ].forEach(({ insts, expr, val, str }) => {
        it(`should \`eval+sol+yul\` \`${str}\``, function () {
            const state = new State<never, Expr>();
            for (const inst of insts) {
                if (typeof inst === 'number') {
                    state.stack.push(new Val(BigInt(inst)));
                } else {
                    STEP()[inst](state);
                }
            }

            expect(state.stack.values).to.be.deep.equal([expr]);
            expect(expr.eval()).to.be.deep.equal(val);
            expect(sol`${expr}`).to.be.equal(str);
            // expect(yul`${expr}`).to.be.equal(str);
        });
    });
});
