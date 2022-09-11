import { expect } from 'chai';
import { FunctionFragment, Interface } from 'ethers/lib/utils';
import { SStore, CallDataLoad, Stop, Require } from '../../src/ast';
import { Variable } from '../../src/contract';
import { stripMetadataHash } from '../../src/metadata';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('variables', compile => {
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
            evm = new EVM(compile(CONTRACT));
        });

        it('should not have functions nor events', () => {
            expect(evm.getFunctions()).to.be.empty;
            expect(evm.getEvents()).to.be.empty;
        });

        [
            { sig: 'setValue0(uint256)', value: 0n },
            { sig: 'setValue0(bytes32)', value: 1n },
        ].forEach(({ sig, value }) => {
            const hash = Interface.getSighash(FunctionFragment.from(sig)).substring(2);
            it(`should find \`SStore\`s in \`#${hash}\`\`${sig}\` blocks`, () => {
                expect(Object.keys(evm.contract.variables)).to.be.of.length(2);
                const stmts = evm.contract.functions[hash].stmts;
                expect(stmts.length).to.be.of.greaterThanOrEqual(3);
                expect(stmts.at(-3)).to.be.instanceOf(Require);
                expect(stmts.at(-2)).to.be.deep.equal(
                    new SStore(value, new CallDataLoad(4n), evm.contract.variables)
                );
                expect(stmts.at(-1)).to.be.deep.equal(new Stop());
            });
        });

        it('should get variables of different types', () => {
            const vars = Object.values(evm.contract.variables);
            expect(vars).to.be.of.length(2);
            expect(vars[0]).to.be.deep.equal(new Variable(undefined, [undefined]));
            expect(vars[1]).to.be.deep.equal(new Variable(undefined, [undefined]));
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.match(/^unknown var1;/m);
            expect(text, text).to.match(/^unknown var2;/m);
            expect(text, text).to.match(/var1 = _arg0;/m);
            expect(text, text).to.match(/var2 = _arg0;/m);
        });
    });

    describe('with private variables of different types', () => {
        let evm: EVM;

        before(() => {
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
            evm = new EVM(compile(CONTRACT));
        });

        it('should not have functions nor events', () => {
            expect(evm.getFunctions()).to.be.empty;
            expect(evm.getEvents()).to.be.empty;
        });

        // const { blocks } = evm.getBlocks();
        // const ss = Object.values(blocks)
        //     .map(block => block.stmts)
        //     .filter(stmts => stmts.find(stmt => stmt instanceof SStore));

        // ss.forEach(s => console.log(s[0]));
        // expect(ss).to.be.of.length(4);

        // expect(Object.values(evm.getContract().variables)).to.be.of.length(4);

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.match(/^unknown var1;/m);
            expect(text, text).to.match(/^unknown var2;/m);
            expect(text, text).to.match(/^unknown var3;/m);
            expect(text, text).to.match(/var1 = _arg0;/m);
            expect(text, text).to.match(/var2 = _arg0;/m);
            expect(text, text).to.match(/var3 = /m);
        });
    });

    describe('with a hashed public variable and no usages', () => {
        let evm: EVM;

        before(() => {
            const CONTRACT = `contract C {
                uint256 public value;
            }`;
            evm = new EVM(stripMetadataHash(compile(CONTRACT))[0]);
        });

        it('should `getFunctions` but not `getEvents`', () => {
            expect(evm.getFunctions()).to.be.deep.equal(['value()']);
            expect(evm.getEvents()).to.be.empty;
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.match(/^unknown public value;/m);
        });
    });

    describe('with a hashed public variable', () => {
        let evm: EVM;

        before(() => {
            const CONTRACT = `contract C {
                uint256 public value;
                function setValue0(uint256 newValue) internal {
                    value = newValue;
                }
            }`;
            evm = new EVM(stripMetadataHash(compile(CONTRACT))[0]);
        });

        it('should `getFunctions` but not `getEvents`', () => {
            expect(evm.getFunctions()).to.be.deep.equal(['value()']);
            expect(evm.getEvents()).to.be.empty;
        });

        it('should `decompile` bytecode', () => {
            // expect(evm.contract.getFunction('value()')!.stmts).deep.equal([]);
            const text = evm.decompile();
            expect(text, text).to.match(/^unknown public value;/m);
        });
    });
});
