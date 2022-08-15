import * as crypto from 'crypto';
import * as fs from 'fs';
import { expect } from 'chai';
import Contract from '../utils/contract.class';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';

const metadata = fs.readFileSync('./test/contracts/metadata.sol', 'utf8');

const generateFFMetadataContract = () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const contract = new Contract();
        const randomData = crypto.randomBytes(16).toString('hex');
        contract.load('contract.sol', metadata.replace('[randomData]', randomData));
        const evm = new EVM(contract.bytecode());
        const swarmHash = evm.getSwarmHash();
        if (swarmHash && typeof swarmHash === 'string' && swarmHash.includes('ff')) {
            return contract;
        }
    }
};

describe('metadata.sol', () => {
    const contract = generateFFMetadataContract();
    const evm = new EVM(contract.bytecode());

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
