import { expect } from 'chai';
import { stripMetadataHash } from '../../src/metadata';
import EVM from '../utils/evmtest';
import { compile, contract, Version } from './utils/solc';

contract('variables', (version: Version) => {
    it('should decompile with a private variable and no usages', () => {
        const CONTRACT = `contract C {
            uint256 private value;
        }`;
        const evm = new EVM(stripMetadataHash(compile('C', CONTRACT, version))[0]);
        expect(evm.getFunctions()).to.be.empty;
        expect(evm.getEvents()).to.be.empty;
        expect(evm.decompile()).to.be.equal('revert();\n');
    });

    it('should decompile with a private variable and unreachable usages', () => {
        const CONTRACT = `contract C {
            uint256 private value;
            function setValue(uint256 newValue) internal {
                value = newValue;
            }
        }`;
        const evm = new EVM(stripMetadataHash(compile('C', CONTRACT, version))[0]);
        expect(evm.getFunctions()).to.be.empty;
        expect(evm.getEvents()).to.be.empty;
        expect(evm.decompile()).to.be.equal('revert();\n');
    });

    it('should decompile with private variables of different types', () => {
        const CONTRACT = `contract C {
            uint256 private value256;
            function setValue0(uint256 newValue) public {
                value256 = newValue;
            }

            bytes32 private value32;
            function setValue0(bytes32 newValue) public {
                value32 = newValue;
            }

            uint64 private value64;
            function setValue0(uint64 newValue) public {
                value64 = newValue;
            }

            bytes8 private value8;
            function setValue0(bytes8 newValue) public {
                value8 = newValue;
            }
        }`;
        const evm = new EVM(stripMetadataHash(compile('C', CONTRACT, version))[0]);
        expect(evm.getFunctions()).to.be.empty;
        expect(evm.getEvents()).to.be.empty;
        const text = evm.decompile();
        expect(text, text).to.match(/^unknown var1;$/m);
        expect(text, text).to.match(/^unknown var2;$/m);
        expect(text, text).to.match(/^unknown var3;$/m);
        expect(text, text).to.match(/var1 = _arg0;$/m);
        expect(text, text).to.match(/var2 = _arg0;$/m);
        expect(text, text).to.match(/var3 = /m);
    });

    it('should decompile with a hashed public variable and no usages', () => {
        const CONTRACT = `contract C {
            uint256 public value;
        }`;
        const evm = new EVM(stripMetadataHash(compile('C', CONTRACT, version))[0]);
        expect(evm.getFunctions()).to.be.deep.equal(['value()']);
        expect(evm.getEvents()).to.be.empty;
        const text = evm.decompile();
        expect(text, text).to.match(/^unknown public value;$/m);
    });

    it('should decompile with a hashed public variable', () => {
        const CONTRACT = `contract C {
            uint256 public value;
            function setValue0(uint256 newValue) internal {
                value = newValue;
            }
        }`;
        const evm = new EVM(stripMetadataHash(compile('C', CONTRACT, version))[0]);
        expect(evm.getFunctions()).to.be.deep.equal(['value()']);
        expect(evm.getEvents()).to.be.empty;
        const text = evm.decompile();
        expect(text, text).to.match(/^unknown public value;$/m);
    });
});
