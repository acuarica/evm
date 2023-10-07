import { randomBytes } from 'crypto';
import { expect } from 'chai';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { Contract, OPCODES } from 'sevm';

import { compile } from '../utils/solc';

describe('contracts metadata', function () {
    const includesFF = (hash: string) => Buffer.from(hash, 'hex').includes(OPCODES.SELFDESTRUCT);

    let contract: Contract;

    before(function () {
        const version = '0.5.5';
        const randomDataPath = join('.solc', `${this.test!.parent!.title}.${version}.data`);
        const solTemplate = `contract C { bytes32 constant data = "[randomData]"; }`;

        try {
            const randomData = readFileSync(randomDataPath, 'utf8');
            const sol = solTemplate.replace('[randomData]', randomData);
            contract = new Contract(compile(sol, version, this).bytecode);
        } catch {
            let sol: string, randomData: string;
            do {
                randomData = randomBytes(16).toString('hex');
                sol = solTemplate.replace('[randomData]', randomData);
                contract = new Contract(compile(sol, version).bytecode);
            } while (contract.metadata && !includesFF(contract.metadata.hash));
            writeFileSync(randomDataPath, randomData);
            this.currentTest!.title += ` (random data ${randomData})`;
        }
    });

    it('should include selfdestruct `ff` in metadata hash', function () {
        expect(includesFF(contract.metadata!.hash)).to.be.true;
    });

    it('should not find `selfdestruct` reachable', function () {
        expect(contract.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
        expect(contract.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
