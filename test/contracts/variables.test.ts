import { expect } from 'chai';
import { Contract, Require } from '../../src';
import { Val } from '../../src/evm/expr';
import { SStore, Variable } from '../../src/evm/storage';
import { Stop } from '../../src/evm/system';
import { fnselector } from '../utils/selector';
import { contracts } from '../utils/solc';
import { CallDataLoad } from '../../src/evm/special';

contracts('variables', (compile, _fallback, version) => {
    describe('with private variables in different locations', function () {
        let contract: Contract;

        before(function () {
            const sol = `contract Contract {
                uint256 private value256;
                function setValue0(uint256 newValue) public { value256 = newValue; }

                bytes32 private value32;
                function setValue0(bytes32 newValue) public { value32 = newValue; }
            }`;
            contract = new Contract(compile(sol, this).bytecode);
        });

        [
            { sig: 'setValue0(uint256)', value: 0n },
            { sig: 'setValue0(bytes32)', value: 1n },
        ].forEach(({ sig, value }) => {
            const selector = fnselector(sig);
            it(`should find \`SStore\`s in \`#${selector}\`\`${sig}\` blocks`, function () {
                const stmts = contract.functions[selector].stmts;
                expect(stmts.length).to.be.of.greaterThanOrEqual(3);
                expect(stmts.at(-3)).to.be.instanceOf(Require);
                const isPush = version !== '0.8.16';
                expect(stmts.at(-2)).to.be.deep.equal(
                    new SStore(
                        new Val(value, true),
                        new CallDataLoad(new Val(4n, isPush)),
                        contract.evm.variables
                    )
                );
                expect(stmts.at(-1)).to.be.deep.equal(new Stop());
            });
        });

        it('should get variables of different types', function () {
            const vars = Object.values(contract.evm.variables);
            expect(vars).to.be.of.length(2);
            const isPush = version !== '0.8.16';
            expect(vars[0]).to.be.deep.equal(
                new Variable(undefined, [new CallDataLoad(new Val(4n, isPush))])
            );
            expect(vars[1]).to.be.deep.equal(
                new Variable(undefined, [new CallDataLoad(new Val(4n, isPush))])
            );
        });

        it('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.match(/^unknown var1;/m);
            expect(text, text).to.match(/^unknown var2;/m);
            expect(text, text).to.match(/var1 = _arg0;/m);
            expect(text, text).to.match(/var2 = _arg0;/m);
        });
    });

    describe('with private variables of different types', function () {
        let contract: Contract;

        before(function () {
            const sol = `contract C {
                uint256 private value256;
                function setValue0(uint256 newValue) public { value256 = newValue; }

                bytes32 private value32;
                function setValue0(bytes32 newValue) public { value32 = newValue; }

                uint64 private value64;
                function setValue0(uint64 newValue) public { value64 = newValue; }

                bytes8 private value8;
                function setValue0(bytes8 newValue) public { value8 = newValue; }
            }`;
            contract = new Contract(compile(sol, this).bytecode);
        });

        it.skip('should detect variables', function () {
            expect(Object.values(contract.evm.variables)).to.be.of.length(4);
        });

        it('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.match(/^unknown var1;/m);
            expect(text, text).to.match(/^unknown var2;/m);
            expect(text, text).to.match(/^unknown var3;/m);
            expect(text, text).to.match(/var1 = _arg0;/m);
            expect(text, text).to.match(/var2 = _arg0;/m);
            expect(text, text).to.match(/var3 = /m);
        });
    });

    describe('with a hashed public variable and no usages', function () {
        let contract: Contract;

        before(function () {
            const sol = `contract C {
                uint256 public value;
            }`;
            contract = new Contract(compile(sol, this).bytecode).patchfns('value()');
        });

        it('should `getFunctions` but not `getEvents`', function () {
            expect(contract.getFunctions()).to.be.deep.equal(['value()']);
        });

        it('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.match(/^unknown public value;/m);
        });
    });

    describe('with an unreachable setter hashed public variable', function () {
        let contract: Contract;

        before(function () {
            const sol = `contract C {
                uint256 public value;
                function setValue0(uint256 newValue) internal {
                    value = newValue;
                }
            }`;
            contract = new Contract(compile(sol, this).bytecode).patchfns('value()');
        });

        it('should `getFunctions` but not `getEvents`', function () {
            expect(contract.getFunctions()).to.be.deep.equal(['value()']);
        });

        it('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.match(/^unknown public value;/m);
        });
    });

    it.skip('with a public `address` variable', function () {
        const sol = `contract C { address public owner; }`;
        const contract = new Contract(compile(sol, this).bytecode).patchfns('owner()');

        expect(contract.getFunctions()).to.be.deep.equal(['owner()']);

        const text = contract.decompile();
        expect(text, text).to.match(/^address public owner;/m);
    });
});
