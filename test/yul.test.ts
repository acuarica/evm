import { expect } from 'chai';

import { yul } from 'sevm';
import {
    Add,
    Byte,
    CallDataLoad,
    CallValue,
    Div,
    IsZero,
    Log,
    MLoad,
    Mul,
    Not,
    Props,
    Sha3,
    Shl,
    Sig,
    Sub,
    Val,
} from 'sevm/ast';

describe('::yul', function () {
    (
        [
            [new Val(4n), '0x4'],
            [new Add(new Val(1n), new Mul(new Val(3n), new Val(2n))), 'add(0x1, mul(0x3, 0x2))'],
            [new IsZero(new Sub(new Val(3n), new Val(2n))), 'iszero(sub(0x3, 0x2))'],
            [new Not(new Div(new Val(3n), new Val(2n))), 'not(div(0x3, 0x2))'],
            [new Byte(new Val(1n), new Div(new Val(3n), new Val(2n))), 'byte(0x1, div(0x3, 0x2))'],
            [new Shl(new Div(new Val(3n), new Val(2n)), new Val(2n)), 'shl(div(0x3, 0x2), 0x2)'],
            [new Sig('12345678'), 'eq(msg.sig, 12345678)'],
            [new CallValue(), 'callvalue()'],
            [new CallDataLoad(new Add(new Val(4n), new Val(8n))), 'calldataload(add(0x4, 0x8))'],
            [new MLoad(new Add(new Val(4n), new Val(8n))), 'mload(add(0x4, 0x8))'],
            [new Sha3(new Val(4n), new Val(8n)), 'keccak256(0x4, 0x8)'],
            [Props['block.coinbase'], 'block.coinbase'],
        ] as const
    ).forEach(([expr, str]) => {
        it(`should convert \`Expr\` to Yul \`${str}\``, function () {
            expect(yul`${expr}`).to.be.equal(str);
        });
    });

    (
        [
            [new Log(undefined, new Val(0n), new Val(32n), [new Val(3n)]), 'log1(0x0, 0x20, 0x3)'],
            [
                new Log(undefined, new Val(64n), new Val(32n), [new Val(3n), new Val(1n)]),
                'log2(0x40, 0x20, 0x3, 0x1)',
            ],
        ] as const
    ).forEach(([inst, str]) => {
        it(`should convert \`Inst\` to Yul \`${str}\``, function () {
            expect(yul`${inst}`).to.be.equal(str);
        });
    });
});
