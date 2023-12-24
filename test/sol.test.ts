import { expect } from 'chai';

import { sol } from 'sevm';
import { Val } from 'sevm/ast';

import { $exprs, title } from './$exprs';

describe('::sol', function () {
    ['0x' + 'ff'.repeat(32), '0x' + 'ff'.repeat(31) + 'fe'].forEach(expected => {
        it(`should \`sol\` ${expected}`, function () {
            expect(sol`${new Val(BigInt(expected))}`).to.be.equal(expected);
        });
    });

    Object.entries($exprs).forEach(([name, exprs]) => {
        describe(name, function () {
            exprs.forEach(({ expr, str }) => {
                it(`should \`sol\` \`${title(expr)}\` into \`${str}\``, function () {
                    expect(sol`${expr}`).to.be.equal(str);
                });
            });
        });
    });

});
