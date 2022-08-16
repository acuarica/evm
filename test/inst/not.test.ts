import { expect } from 'chai';
import EVM from '../utils/evmtest';

describe('NOT', () => {
    it('should calculate `~1`', () => {
        const evm = new EVM('0x19');
        evm.stack.push(1n);
        expect(evm.stack.elements).to.deep.equal([1n]);
        evm.parse();
        expect(evm.stack.elements).to.deep.equal([~1n]);
    });

    it('should stringify `~x`', () => {
        const evm = new EVM('0x19');
        evm.stack.push('x');
        expect(evm.stack.elements).to.deep.equal(['x']);
        evm.parse();
        expect(evm.stack.elements[0].toString()).to.equal('~x');
    });
});
