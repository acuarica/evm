import { expect } from 'chai';

import { yul } from 'sevm';
import { Add, Log, MLoad, Sha3, Val } from 'sevm/ast';
import { $exprs, title } from './$exprs';

describe('::yul', function () {

    ([
        [new MLoad(new Add(new Val(4n), new Val(8n))), 'mload(add(0x4, 0x8))'],
        [new Sha3(new Val(4n), new Val(8n)), 'keccak256(0x4, 0x8)'],
    ] as const).forEach(([expr, str]) => {
        it(`should convert \`Expr\` to Yul \`${str}\``, function () {
            expect(yul`${expr}`).to.be.equal(str);
        });
    });

    ([
        [new Log(undefined, new Val(0n), new Val(32n), [new Val(3n)]), 'log1(0x0, 0x20, 0x3)'],
        [new Log(undefined, new Val(64n), new Val(32n), [new Val(3n), new Val(1n)]), 'log2(0x40, 0x20, 0x3, 0x1)'],
    ] as const).forEach(([inst, str]) => {
        it(`should convert \`Inst\` to Yul \`${str}\``, function () {
            expect(yul`${inst}`).to.be.equal(str);
        });
    });

    Object.entries($exprs).forEach(([name, exprs]) => {
        describe(name, function () {
            exprs.forEach(({ expr, yulstr }) => {
                it(`should \`yul\` \`${title(expr)}\` into \`${yulstr}\``, function () {
                    expect(yul`${expr}`).to.be.equal(yulstr);
                });
            });
        });
    });

});
