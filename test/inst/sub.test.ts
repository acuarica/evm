import { expect } from 'chai';
import EVM, { Sym } from '../utils/evmtest';

describe('SUB', () => {
    it('should calculate `1 - 1`', () => {
        const evm = new EVM('0x03');
        evm.stack.push(1n);
        evm.stack.push(1n);
        expect(evm.stack.elements).to.be.deep.equal([1n, 1n]);
        evm.parse();
        expect(evm.stack.elements).to.be.deep.equal([0n]);
    });

    it('should stringify `x - 1`', () => {
        const evm = new EVM('0x03');
        evm.stack.push(1n);
        evm.stack.push(new Sym());
        expect(evm.stack.elements).to.be.deep.equal([new Sym(), 1n]);
        evm.parse();
        expect(evm.stack.elements).has.length(1);
        expect(evm.stack.elements[0].toString()).to.be.equal('x - 1');
    });
});
