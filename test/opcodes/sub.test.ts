import { expect } from 'chai';
import EVM from '../utils/evmtest';

describe('SUB', () => {
    it('should calculate `1 - 1`', () => {
        const evm = new EVM('0x03');
        evm.stack.push(1n);
        evm.stack.push(1n);
        expect(evm.stack.elements).to.deep.equal([1n, 1n]);
        evm.parse();
        expect(evm.stack.elements).to.deep.equal([0n]);
    });

    it('should stringify `x - 1`', () => {
        const evm = new EVM('0x03');
        evm.stack.push(1n);
        evm.stack.push('x');
        expect(evm.stack.elements).to.deep.equal(['x', 1n]);
        evm.parse();
        expect(evm.stack.elements[0].toString()).to.equal('x - 1');
    });
});
