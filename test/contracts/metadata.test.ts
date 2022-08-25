import * as crypto from 'crypto';
import { expect } from 'chai';
import { compile } from './utils/solc';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';

const CONTRACT = `
pragma solidity 0.5.5;

contract Contract {
    bytes32 constant data = "[randomData]";
}
`;

function generateFFMetadataContract() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const randomData = crypto.randomBytes(16).toString('hex');
        const evm = new EVM(compile('metadata', CONTRACT.replace('[randomData]', randomData)));
        const swarmHash = evm.getMetadataHash();

        if (swarmHash && typeof swarmHash === 'string' && swarmHash.includes('ff')) {
            // console.log('asdfadf');
            // console.log(swarmHash);
            return evm;
        }
    }
}

describe('contracts::metadata', () => {
    let evm: EVM;

    before(() => {
        evm = generateFFMetadataContract();
    });

    it('should include false positive selfdestruct (`ff`) in metadata hash', () => {
        expect(evm.getMetadataHash()).to.include('ff');
    });

    it('should not detect selfdestruct', () => {
        expect(evm.containsOpcode(SELFDESTRUCT)).to.be.false;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
