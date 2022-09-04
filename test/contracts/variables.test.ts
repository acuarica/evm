import { config, expect } from 'chai';
import { Variable } from '../../src/contract';
import { CallDataLoad } from '../../src/inst/info';
import { SStore } from '../../src/inst/storage';
import { Stop } from '../../src/inst/system';
import { stripMetadataHash } from '../../src/metadata';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

config.truncateThreshold = 0;

contract('variables', version => {
    describe('with private variables in different locations', () => {
        let evm: EVM;

        before(() => {
            const CONTRACT = `contract Contract {
                uint256 private value256;
                function setValue0(uint256 newValue) public {
                    value256 = newValue;
                }

                bytes32 private value32;
                function setValue0(bytes32 newValue) public {
                    value32 = newValue;
                }
            }`;
            evm = new EVM(compile('Contract', CONTRACT, version));
        });

        it('should not have functions nor events', () => {
            expect(evm.getFunctions()).to.be.empty;
            expect(evm.getEvents()).to.be.empty;
        });

        it('should get `SSTORE` in blocks', () => {
            const { blocks } = evm.getBlocks();
            const sstores = Object.values(blocks)
                .map(block => block.stmts)
                .filter(stmts => stmts.find(stmt => stmt instanceof SStore));
            expect(sstores).to.be.of.length(2);

            for (const stmts of sstores) {
                expect(stmts).to.be.of.length(2);
                expect(stmts[0]).to.be.deep.oneOf([
                    new SStore(0n, new CallDataLoad(4n), evm.getContract().variables),
                    new SStore(1n, new CallDataLoad(4n), evm.getContract().variables),
                ]);
                expect(stmts[1]).to.be.instanceOf(Stop);
            }
        });

        it('should get variables of different types', () => {
            const vars = Object.values(evm.getContract().variables);
            expect(vars).to.be.of.length(2);
            expect(vars[0]).to.be.deep.equal(new Variable(undefined, [undefined]));
            expect(vars[1]).to.be.deep.equal(new Variable(undefined, [undefined]));
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.match(/^unknown var1;$/m);
            expect(text, text).to.match(/^unknown var2;$/m);
            expect(text, text).to.match(/var1 = _arg0;$/m);
            expect(text, text).to.match(/var2 = _arg0;$/m);
        });
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
        const evm = new EVM(compile('C', CONTRACT, version));
        expect(evm.getFunctions()).to.be.empty;
        expect(evm.getEvents()).to.be.empty;
        // const { blocks } = evm.getBlocks();
        // const ss = Object.values(blocks)
        //     .map(block => block.stmts)
        //     .filter(stmts => stmts.find(stmt => stmt instanceof SStore));

        // ss.forEach(s => console.log(s[0]));
        // expect(ss).to.be.of.length(4);

        // expect(Object.values(evm.getContract().variables)).to.be.of.length(4);

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
