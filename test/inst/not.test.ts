import { expect } from 'chai';
import EVM, { Sym } from '../utils/evmtest';

describe('NOT', () => {
    it('should calculate `~1`', () => {
        const evm = new EVM('0x19');
        evm.stack.push(1n);
        expect(evm.stack.values).to.deep.equal([1n]);
        evm.parse();
        expect(evm.stack.values).to.deep.equal([~1n]);
    });

    it('should stringify `~x`', () => {
        const evm = new EVM('0x19');
        evm.stack.push(new Sym());
        expect(evm.stack.values).to.be.deep.equal([new Sym()]);
        evm.parse();
        expect(evm.stack.values).has.length(1);
        expect(evm.stack.values[0].toString()).to.be.equal('~x');
    });
});
