import { expect } from 'chai';
import EVM from '../utils/evmtest';

describe('DUP', () => {
    [...Array(16).keys()].forEach(function (size) {
        it(`should dup #${size + 1} element on the stack`, () => {
            const evm = new EVM('0x' + (0x80 + size).toString(16));
            evm.stack.push(2n);

            const ignored = [];
            for (let i = 0; i < size; i++) {
                ignored.push(1n);
                evm.stack.push(1n);
            }

            evm.parse();

            expect(evm.stack.elements).to.deep.equal([2n, ...ignored, 2n]);
        });

        it(`should throw when #${size + 1} element is not present on the stack`, () => {
            const evm = new EVM('0x' + (0x80 + size).toString(16));

            const ignored = [];
            for (let i = 0; i < size; i++) {
                ignored.push(1n);
                evm.stack.push(1n);
            }

            expect(() => evm.parse()).to.throw('Invalid duplication operation');
        });
    });
});
