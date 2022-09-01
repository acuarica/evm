import { expect } from 'chai';
import { SYSTEM } from '../../src/inst/system';
import EVM from '../utils/evmtest';

describe('STOP', () => {
    it('should halt', () => {
        const evm = new EVM('0x00');
        expect(evm.halted).to.be.false;
        evm.parse();
        expect(evm.halted).to.be.true;
    });

    it('should halt', () => {
        const evm = new EVM('0x00');
        expect(evm.halted).to.be.false;
        evm.parse();
        SYSTEM.STOP();
        expect(evm.halted).to.be.true;
    });
});
