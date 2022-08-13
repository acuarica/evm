import { expect } from 'chai';
import EVM from './utils/evmtest';

describe('evm.class.ts', () => {
    it('should create an instance', () => {
        const evm = new EVM('0xfd');
        expect(evm).to.be.an.instanceof(EVM);
    });
});
