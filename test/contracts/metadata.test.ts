import * as crypto from 'crypto';
import { expect } from 'chai';
import { OPCODES } from '../../src/opcode';
import { Contract } from '../../src';
import { compile } from '../utils/solc';

describe('contracts metadata', () => {
    let contract: Contract;

    before(() => {
        const sol = `contract C { bytes32 constant data = "[rd]"; }`;
        do {
            const randomData = crypto.randomBytes(16).toString('hex');
            contract = new Contract(compile(sol.replace('[rd]', randomData), '0.5.5').bytecode);
        } while (contract.metadata && !contract.metadata.hash.includes('ff'));
    });

    it('should include false positive selfdestruct (`ff`) in metadata hash', () => {
        expect(contract.metadata!.hash).to.include('ff');
    });

    it('should not detect selfdestruct', () => {
        expect(contract.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
        expect(contract.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
