import { randomBytes } from 'crypto';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import { join } from 'path';

import { EVM } from 'sevm';

import { compile } from '../utils/solc';

describe.skip('contracts metadata', function () {
    // const includesFF = (hash: string) => Buffer.from(hash, 'hex').includes(OPCODES.SELFDESTRUCT);
    const includesFF = (hash: string) => hash.match(/^([0-9a-f]{2})*5b([0-9a-f]{2})*ff/) !== null;

    // let evm: EVM<{functionBranches:ISelectorBranches}>;

    it('should not find `selfdestruct` reachable', function () {
        // it('should include selfdestruct `ff` in metadata hash', function () {
        this.timeout(100000);
        const version = '0.5.5';
        const randomDataPath = join('.solc', `${this.test!.parent!.title}.${version}.data`);
        const solTemplate = `contract Test { bytes32 constant data = "[randomData]"; }`;

        let evm;
        try {
            const randomData = readFileSync(randomDataPath, 'utf8');
            const src = solTemplate.replace('[randomData]', randomData);
            evm = EVM.new(compile(src, version, this).bytecode);
        } catch {
            let src: string, randomData: string;
            do {
                randomData = randomBytes(16).toString('hex');
                src = solTemplate.replace('[randomData]', randomData);
                evm = EVM.new(compile(src, version, null).bytecode);
                console.log(randomData, evm.metadata?.hash);
            } while (!includesFF(evm.metadata!.hash) || !evm.containsOpcode('SELFDESTRUCT'));
            // writeFileSync(randomDataPath, randomData);
            this.currentTest!.title += ` (random data ${randomData})`;
        }

        expect(includesFF(evm.metadata!.hash)).to.be.true;
        // expect(evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
        expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
    });
});
