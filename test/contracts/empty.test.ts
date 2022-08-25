import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { SELFDESTRUCT } from '../../src/codes';
import { compile, VERSIONS } from './utils/solc';

const HASHES = {
    '0.5.5': 'bzzr://e9e23a2fc4943df291ec2a003b44d656b4f1e45cad600af5a22979f8aefa8f7a',
    '0.5.17': 'bzzr://7ad9f52cb195e236916f424f2b7e6f466b341ce9de1a732257c4a67848378ee4',
    '0.8.16': 'ipfs://1220915bb2e4312c26653b8c0414c6e6d1e36938d91281c3e3dbb19092ba2f86dd2b',
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
