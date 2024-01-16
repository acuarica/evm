import { expect } from 'chai';

import { yul } from 'sevm';
import { Log, Val } from 'sevm/ast';

describe('::yul', function () {

    ([
        [new Log(undefined, new Val(0n), new Val(32n), [new Val(3n)]), 'log1(0x0, 0x20, 0x3)'],
        [new Log(undefined, new Val(64n), new Val(32n), [new Val(3n), new Val(1n)]), 'log2(0x40, 0x20, 0x3, 0x1)'],
    ] as const).forEach(([inst, str]) => {
        it(`should convert \`Inst\` to Yul \`${str}\``, function () {
            expect(yul`${inst}`).to.be.equal(str);
        });
    });
});
