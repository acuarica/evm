import { expect } from 'chai';
import { Stack } from '../../src';
import { PUSHES } from '../../src/inst/core';

describe('PUSH', () => {
    it('should modify stack', () => {
        const one = new Uint8Array(1);
        one[0] = 1;
        const stack = new Stack<bigint>();
        PUSHES().PUSH1(one, stack);
        expect(stack.values).to.deep.equal([1n]);
    });
});
