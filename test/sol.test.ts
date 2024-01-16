import { expect } from 'chai';

import { sol } from 'sevm';
import { Val } from 'sevm/ast';

describe('::sol', function () {
    ['0x' + 'ff'.repeat(32), '0x' + 'ff'.repeat(31) + 'fe'].forEach(expected => {
        it(`should \`sol\` ${expected}`, function () {
            expect(sol`${new Val(BigInt(expected))}`).to.be.equal(expected);
        });
    });


});
