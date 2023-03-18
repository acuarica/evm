import { expect } from 'chai';
import { type Expr, Val } from '../../src/evm/expr';
import { CallDataLoad, CallDataSize, CallValue, ENV } from '../../src/evm/env';
import { Stack } from '../../src/state';

describe('evm::env', () => {
    it(`should push \`CallValue\``, () => {
        const stack = new Stack<Expr>();
        ENV.CALLVALUE(stack);

        expect(stack.values).to.deep.equal([new CallValue()]);
        expect(stack.values[0].toString()).to.equal('msg.value');
    });

    it(`should push \`CallDataSize\``, () => {
        const stack = new Stack<Expr>();
        ENV.CALLDATASIZE(stack);

        expect(stack.values).to.deep.equal([new CallDataSize()]);
        expect(stack.values[0].toString()).to.equal('msg.data.length');
    });

    describe('CallDataLoad', () => {
        [
            [0n, 'msg.data'] as const,
            [4n, '_arg0'] as const,
            [36n, '_arg1'] as const,
            [68n, '_arg2'] as const,
            [1n, 'msg.data[0x1]'] as const,
            [32n, 'msg.data[0x20]'] as const,
        ].forEach(([loc, str]) => {
            it(`should push \`CallDataLoad\` at :${loc} stringified to \`${str}\``, () => {
                const stack = new Stack<Expr>();
                stack.push(new Val(loc));
                ENV.CALLDATALOAD(stack);

                expect(stack.values).to.deep.equal([new CallDataLoad(new Val(loc))]);
                expect(stack.values[0].toString()).to.equal(str);
            });
        });
    });
});
