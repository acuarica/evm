import { expect } from 'chai';
import EVM from './utils/evmtest';

describe('evm', () => {
    it('should create an instance with `INVALID` opcodes', () => {
        const evm = new EVM('0x0c0d0e0ffc');
        expect(evm).to.be.an.instanceof(EVM);

        expect(evm.opcodes.map(op => op.mnemonic)).to.be.deep.equal(Array(5).fill('INVALID'));
    });
});
