import { expect } from 'chai';

import { yul } from 'sevm';
import { Add, Block, IsZero, Log, Mul, Val } from 'sevm/ast';

describe('yul', function () {
    [
        {
            expr: new IsZero(new Add(new Val(1n), new Mul(new Val(3n), new Val(2n)))),
            str: 'iszero(add(0x1, mul(0x3, 0x2)))',
        },
        {
            expr: Block.coinbase,
            str: 'block.coinbase',
        },
    ].forEach(({ expr, str }) => {
        it(`should convert expression to Yul \`${str}\``, function () {
            expect(yul`${expr}`).to.be.equal(str);
        });
    });

    [
        {
            inst: new Log(undefined, [new Val(3n)], { offset: new Val(0n), size: new Val(32n) }),
            str: 'log1(0x0, 0x3);',
        },
        {
            inst: new Log(undefined, [new Val(3n)], { offset: new Val(64n), size: new Val(32n) }),
            str: 'log1(0x40, 0x3);',
        },
    ].forEach(({ inst, str }) => {
        it(`should convert instruction to Yul \`${str}\``, function () {
            expect(yul`${inst}`).to.be.equal(str);
        });
    });
});
