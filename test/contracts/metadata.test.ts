import * as crypto from 'crypto';
import { expect } from 'chai';
import Contract from './utils/solc';
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
        const contract = new Contract();
        const randomData = crypto.randomBytes(16).toString('hex');
        contract.load('metadata', CONTRACT.replace('[randomData]', randomData));
        const evm = new EVM(contract.bytecode());
        const swarmHash = evm.getSwarmHash();
        if (swarmHash && typeof swarmHash === 'string' && swarmHash.includes('ff')) {
            return contract;
        }
    }
}

describe('contracts::metadata', () => {
    let contract: Contract;
    let evm: EVM;

    before(() => {
        contract = generateFFMetadataContract();
        evm = new EVM(contract.bytecode());
    });

    it('should compile without errors', () => {
        expect(contract.valid(), contract.errors().join('\n')).to.be.true;
    });

    it('should include false positive selfdestruct (`ff`) in metadata hash', () => {
        expect(evm.getSwarmHash()).to.include('ff');
    });

    it('should not detect selfdestruct', () => {
        expect(evm.containsOpcode(SELFDESTRUCT)).to.be.false;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
