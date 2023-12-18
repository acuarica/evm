import { expect } from 'chai';

import { Contract, Require } from 'sevm';
import { CallDataLoad, SStore, Stop, Val, Variable } from 'sevm/ast';

import { fnselector } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('variables', (compile, _fallback, version) => {
    describe.skip('with private variables in different locations', function () {
        let contract: Contract;

        before(function () {
            const src = `contract Test {
                uint256 private value256;
                function setValue0(uint256 newValue) public { value256 = newValue; }

                bytes32 private value32;
                function setValue0(bytes32 newValue) public { value32 = newValue; }
            }`;
            contract = new Contract(compile(src, this).bytecode);
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
                        contract.variables
                    )
                );
                expect(stmts.at(-1)).to.be.deep.equal(new Stop());
            });
        });

        it('should get variables of different types', function () {
            const vars = Object.values(contract.variables);
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
            const text = contract.solidify();
            expect(text, text).to.match(/^unknown var1;/m);
            expect(text, text).to.match(/^unknown var2;/m);
            expect(text, text).to.match(/var1 = _arg0;/m);
            expect(text, text).to.match(/var2 = _arg0;/m);
        });
    });

    describe.skip('with private variables of different types', function () {
        let contract: Contract;

        before(function () {
            const src = `contract Test {
                uint256 private value256;
                function setValue0(uint256 newValue) public { value256 = newValue; }

                bytes32 private value32;
                function setValue0(bytes32 newValue) public { value32 = newValue; }

                uint64 private value64;
                function setValue0(uint64 newValue) public { value64 = newValue; }

                bytes8 private value8;
                function setValue0(bytes8 newValue) public { value8 = newValue; }
            }`;
            contract = new Contract(compile(src, this).bytecode);
        });

        it.skip('should detect variables', function () {
            expect(Object.values(contract.variables)).to.be.of.length(4);
        });

        it('should `decompile` bytecode', function () {
            const text = contract.solidify();
            expect(text, text).to.match(/^unknown var1;/m);
            expect(text, text).to.match(/^unknown var2;/m);
            expect(text, text).to.match(/^unknown var3;/m);
            expect(text, text).to.match(/var1 = _arg0;/m);
            expect(text, text).to.match(/var2 = _arg0;/m);
            expect(text, text).to.match(/var3 = /m);
        });
    });

    describe.skip('with a hashed public variable and no usages', function () {
        let contract: Contract;

        before(function () {
            const src = `contract Test {
                uint256 public value;
            }`;
            contract = new Contract(compile(src, this).bytecode).patchfns('value()');
        });

        it('should `getFunctions` but not `getEvents`', function () {
            expect(contract.getFunctions()).to.be.deep.equal(['value()']);
        });

        it('should `decompile` bytecode', function () {
            const text = contract.solidify();
            expect(text, text).to.match(/^unknown public value;/m);
        });
    });

    describe.skip('with an unreachable setter hashed public variable', function () {
        let contract: Contract;

        before(function () {
            const src = `contract Test {
                uint256 public value;
                function setValue0(uint256 newValue) internal {
                    value = newValue;
                }
            }`;
            contract = new Contract(compile(src, this).bytecode).patchfns('value()');
        });

        it('should `getFunctions` but not `getEvents`', function () {
            expect(contract.getFunctions()).to.be.deep.equal(['value()']);
        });

        it('should `decompile` bytecode', function () {
            const text = contract.solidify();
            expect(text, text).to.match(/^unknown public value;/m);
        });
    });

    it.skip('with a public `address` variable', function () {
        const src = `contract Test { address public owner; }`;
        const contract = new Contract(compile(src, this).bytecode).patchfns('owner()');

        expect(contract.getFunctions()).to.be.deep.equal(['owner()']);

        const text = contract.solidify();
        expect(text, text).to.match(/^address public owner;/m);
    });
});
