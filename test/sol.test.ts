import { expect } from 'chai';

import { sol } from 'sevm';
import { Add, Block, Mul, Val } from 'sevm/ast';

describe('sol', function () {
    (
        [
            [new Add(new Val(1n), new Mul(new Val(3n), new Val(2n))), '0x1 + 0x3 * 0x2'],
            [Block.coinbase, 'block.coinbase'],
        ] as const
    ).forEach(([expr, str]) => {
        it(`should convert expression to Yul \`${str}\``, function () {
            expect(sol`${expr}`).to.be.equal(str);
        });
    });
});
