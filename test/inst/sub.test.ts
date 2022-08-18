import { expect } from 'chai';
import { BlockNumber } from '../../src/inst/block';
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
        evm.stack.push(new BlockNumber());
        expect(evm.stack.elements).to.deep.equal([new BlockNumber(), 1n]);
        evm.parse();
        expect(evm.stack.elements).has.length(1);
        expect(evm.stack.elements[0].toString()).to.equal('block.number - 1');
    });
});
