import { expect } from 'chai';
import { NUMBER } from '../../src/opcodes/number';
import EVM from '../utils/evmtest';

describe('NOT', () => {
    it('should calculate `~1`', () => {
        const evm = new EVM('0x19');
        evm.stack.push(1n);
        expect(evm.stack.elements).to.deep.equal([1n]);
        evm.parse();
        expect(evm.stack.elements).to.deep.equal([~1n]);
    });

    it('should stringify `~block.number`', () => {
        const evm = new EVM('0x19');
        evm.stack.push(new NUMBER());
        expect(evm.stack.elements).to.deep.equal([new NUMBER()]);
        evm.parse();
        expect(evm.stack.elements).has.length(1);
        expect(evm.stack.elements[0].toString()).to.equal('~block.number');
    });
});
