import * as crypto from 'crypto';
import { expect } from 'chai';
import { compile } from './utils/solc';
import EVM from '../utils/evmtest';
import { OPCODES } from '../../src/opcode';

const CONTRACT = `
contract C {
    bytes32 constant data = "[randomData]";
}
`;

function generateFFMetadataContract() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const randomData = crypto.randomBytes(16).toString('hex');
        const evm = new EVM(
            compile(CONTRACT.replace('[randomData]', randomData), '0.5.5').deployedBytecode
        );
        const swarmHash = evm.metadata!.hash;

        if (swarmHash && typeof swarmHash === 'string' && swarmHash.includes('ff')) {
            return evm;
        }
    }
}

describe('contracts metadata', () => {
    let evm: EVM;

    before(() => {
        evm = generateFFMetadataContract();
    });

    it('should include false positive selfdestruct (`ff`) in metadata hash', () => {
        expect(evm.metadata!.hash).to.include('ff');
    });

    it('should not detect selfdestruct', () => {
        expect(evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
