// import * as crypto from 'crypto';
import { expect } from 'chai';

import { Contract, OPCODES } from 'sevm';

import { compile } from '../utils/solc';

const includesFF = (hash: string) => Buffer.from(hash, 'hex').includes(OPCODES.SELFDESTRUCT);

describe('contracts metadata', function () {
    let contract: Contract;

    before(function () {
        const sol = 'contract C { bytes32 constant data = "c4fbd955063067b19422684fc2e52142"; }';
        // const solTemplate = `contract C { bytes32 constant data = "[rd]"; }`;
        // let sol;
        // do {
        // const randomData = crypto.randomBytes(16).toString('hex');
        // sol = solTemplate.replace('[rd]', randomData);
        contract = new Contract(compile(sol, '0.5.5').bytecode);
        // } while (contract.metadata && !includesFF(contract.metadata.hash));
        // console.log(sol);
        // console.log(contract.metadata!.hash);
    });

    it('should include false positive selfdestruct (`ff`) in metadata hash', function () {
        expect(includesFF(contract.metadata!.hash)).to.be.true;
    });

    it('should not detect selfdestruct', function () {
        expect(contract.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
        expect(contract.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
