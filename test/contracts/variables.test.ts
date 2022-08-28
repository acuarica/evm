import { expect } from 'chai';
import { stripMetadataHash } from '../../src/metadata';
import EVM from '../utils/evmtest';
import { compile, solcs, VERSIONS } from './utils/solc';

describe('contracts::variables', () => {
    VERSIONS.forEach(version => {
        describe(`using solc-v${solcs[version].version()}`, () => {
            describe('with private variable', () => {
                let evm: EVM;

                before(() => {
                    const CONTRACT = `contract C {
                        uint256 value;
                    }`;
                    evm = new EVM(stripMetadataHash(compile('C', CONTRACT, version))[0]);
                });

                it('should not have functions', () => {
                    expect(evm.getFunctions()).to.be.empty;
                });

                it('should not have events', () => {
                    expect(evm.getEvents()).to.be.empty;
                });

                it('should decompile bytecode', () => {
                    expect(evm.decompile()).to.be.equal('revert();\n');
                });
            });

            describe('with hashed public variable', () => {
                let evm: EVM;

                before(() => {
                    const CONTRACT = `contract C {
                        uint256 public value;
                    }`;
                    evm = new EVM(stripMetadataHash(compile('C', CONTRACT, version))[0]);
                });

                it('should have `value()` as functions', () => {
                    expect(evm.getFunctions()).to.be.deep.equal(['value()']);
                });

                it('should not have events', () => {
                    expect(evm.getEvents()).to.be.empty;
                });

                it('should decompile bytecode', () => {
                    const text = evm.decompile();
                    expect(text, text).to.match(/^unknown public value;$/m);
                });
            });
        });
    });
});
