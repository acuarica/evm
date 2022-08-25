import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';
import { compile, VERSIONS } from './utils/solc';

const HASHES = {
    '0.5.5': 'bzzr://21979a02bd63f5db5ee0ced275b81e8407ae1252d879b2143fe47da327f26dbd',
    '0.5.17': 'bzzr://e7a2b3aa2410f08d6ab702e1d605cd779c106134ed242b57d0dbe67390d4a766',
    '0.8.16': 'ipfs://1220b9c8a18d8f2f694ef2a30219acc4e9ddf79dd3eef10c395d968869a3480fd6cd',
};

const DECOMPILE = `revert();
`;

describe('contracts::empty', () => {
    VERSIONS.forEach(version => {
        describe(`using solc-v${version}`, () => {
            const CONTRACT = `// SPDX-License-Identifier: MIT
            pragma solidity ${version};
            contract Empty { }`;

            let evm: EVM;

            before(() => {
                evm = new EVM(compile('Empty', CONTRACT, version));
            });

            it('should not detect selfdestruct', () => {
                expect(evm.containsOpcode(SELFDESTRUCT)).to.be.false;
                expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
            });

            it('should not have functions', () => {
                expect(evm.getFunctions()).to.be.empty;
            });

            it('should not have events', () => {
                expect(evm.getEvents()).to.be.empty;
            });

            it('should get metadata hash', () => {
                expect(evm.getMetadataHash()).to.be.equal(HASHES[version]);
            });

            it('should decompile bytecode', () => {
                // console.log(evm.getOpcodes().forEach(op => console.log(op.toString())));
                // console.log(evm.decompile());
                expect(evm.decompile()).to.be.equal(DECOMPILE);
            });
        });
    });
});
