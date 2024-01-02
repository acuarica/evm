import { randomBytes } from 'crypto';
import { expect } from 'chai';
import { join } from 'path';
import * as fs from 'fs';

import { EVM, Shanghai, stripMetadataHash } from 'sevm';

import { compile } from '../utils/solc';

describe('contracts metadata', function () {

    it('should not find `selfdestruct` reachable in metadata', function () {
        const SELFDESTRUCT = new Shanghai().opcodes().SELFDESTRUCT;
        const includesFF = (hash: string) => Buffer.from(hash, 'hex').includes(SELFDESTRUCT);

        const version = '0.5.5';
        const randomDataPath = join('.solc', `${this.test!.parent!.title}.${version}.data`);
        const solTemplate = `contract Test { bytes32 constant data = "[randomData]"; }`;

        let randomData, metadata;
        try {
            randomData = fs.readFileSync(randomDataPath, 'utf8');
        } catch {
            do {
                randomData = randomBytes(16).toString('hex');
                const src = solTemplate.replace('[randomData]', randomData);
                metadata = stripMetadataHash(compile(src, version, null).bytecode)[1]!;
            } while (!includesFF(metadata.hash));
            fs.writeFileSync(randomDataPath, randomData);
        }

        const src = solTemplate.replace('[randomData]', randomData);
        const evm = EVM.new(compile(src, version, this).bytecode);

        this.test!.title += ` (data ${randomData} | hash ${evm.metadata?.hash})`;

        expect(includesFF(evm.metadata!.hash)).to.be.true;

        evm.start();
        expect(evm.opcodes().filter(o => o.opcode === SELFDESTRUCT)).to.be.empty;
    });
});
