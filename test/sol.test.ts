import { expect } from 'chai';

import { sol } from 'sevm';
import { Add, Block, Mul, Val } from 'sevm/ast';

describe('sol', function () {
    [
        {
            expr: new Add(new Val(1n), new Mul(new Val(3n), new Val(2n))),
            str: 'iszero(add(1, mul(3, 2)))',
        },
        {
            expr: Block.coinbase,
            str: 'block.coinbase',
        },
    ].forEach(({ expr, str }) => {
        it.skip(`should convert expression to Yul \`${str}\``, function () {
            expect(sol`${expr}`).to.be.equal(str);
        });
    });
});
