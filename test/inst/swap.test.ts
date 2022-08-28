import { expect } from 'chai';
import EVM from '../utils/evmtest';

describe('SWAP', () => {
    [...Array(16).keys()].forEach(function (size) {
        it(`should swap #${size + 1} element on the stack`, () => {
            const evm = new EVM('0x' + (0x90 + size).toString(16));
            evm.stack.push(2n);

            const ignored = [];
            for (let i = 0; i < size; i++) {
                ignored.push(1n);
                evm.stack.push(1n);
            }

            evm.stack.push(3n);

            evm.parse();

            expect(evm.stack.values).to.deep.equal([2n, ...ignored, 3n]);
        });

        it(`should throw when #${size + 2} element is not present on the stack`, () => {
            const evm = new EVM('0x' + (0x90 + size).toString(16));

            for (let i = 0; i <= size; i++) {
                evm.stack.push(1n);
            }

            expect(() => evm.parse()).to.throw('Invalid swap operation');
        });
    });
});
