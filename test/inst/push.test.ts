import { expect } from 'chai';
import EVM from '../utils/evmtest';

describe('PUSH', () => {
    it('should modify stack', () => {
        const evm = new EVM('0x6001');
        expect(evm.stack.elements).to.deep.equal([]);
        evm.parse();
        expect(evm.stack.elements).to.deep.equal([1n]);
    });
});
