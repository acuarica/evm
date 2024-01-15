import { expect } from 'chai';

import { Contract } from 'sevm';
import { CallDataLoad, Require, SStore, Stop, Val, Variable } from 'sevm/ast';

import { fnselector } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('variables', (compile, _fallback, version) => {
    describe('with private variables in different locations', function () {
        let contract: Contract;

        before(function () {
            const src = `contract Test {
                uint256 private value256;
                function setValue0(uint256 newValue) public { value256 = newValue; }

                bytes32 private value32;
                function setValue0(bytes32 newValue) public { value32 = newValue; }
            }`;
            contract = new Contract(compile(src, this).bytecode).reduce();
        });

        [
            { sig: 'setValue0(uint256)', value: 0n },
            { sig: 'setValue0(bytes32)', value: 1n },
        ].forEach(({ sig, value }) => {
            const selector = fnselector(sig);
            it.skip(`should find \`SStore\`s in \`#${selector}\`\`${sig}\` blocks`, function () {
                const stmts = contract.functions[selector].stmts;
                expect(stmts.length).to.be.of.greaterThanOrEqual(3);
                expect(stmts.at(-3)).to.be.instanceOf(Require);
                const isPush = version !== '0.8.16';
                expect(stmts.at(-2)).to.be.deep.equal(
                    new SStore(
                        new Val(value, true),
                        new CallDataLoad(new Val(4n, isPush)),
                        undefined
                        // contract.variables
                    )
                );
                expect(stmts.at(-1)).to.be.deep.equal(new Stop());
            });
        });

        it('should get variables of different types', function () {
            const vars = [...contract.variables.values()];
            expect(vars).to.be.of.length(2);
            const isPush = version !== '0.8.16' && version !== '0.8.21';
            expect(vars[0]).to.be.deep.equal(
                new Variable(null, [new CallDataLoad(new Val(4n, isPush))], 1)
            );
            expect(vars[1]).to.be.deep.equal(
                new Variable(null, [new CallDataLoad(new Val(4n, isPush))], 2)
            );
        });

        it('should `decompile` bytecode', function () {
            const text = contract.solidify();
            expect(text, text).to.contain('unknown var1__1;');
            expect(text, text).to.contain('unknown var2__2;');
            expect(text, text).to.contain('var_1 = _arg0;');
            expect(text, text).to.contain('var_2 = _arg0;');
        });
    });

    it.skip('with private variables of different types', function () {
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
        const contract = new Contract(compile(src, this).bytecode);

        const text = contract.solidify();
        expect(text, text).to.match(/^unknown var1__1;/m);
        expect(text, text).to.match(/^unknown var2__2;/m);
        expect(text, text).to.match(/^unknown var3__3;/m);
        expect(text, text).to.match(/var1__1 = _arg0;/m);
        expect(text, text).to.match(/var2__2 = _arg0;/m);
        expect(text, text).to.match(/var3__3 = /m);

        // expect(contract.variables).to.be.of.length(4);
        expect(contract.variables).to.be.of.length(3);
    });

    it('should `sol` a hashed public variable with no usages', function () {
        const src = `contract Test { uint256 public value; }`;
        const contract = new Contract(compile(src, this).bytecode).patchfns('value()');

        expect(contract.getFunctions()).to.be.deep.equal(['value()']);

        const text = contract.solidify();
        expect(text, text).to.match(/^unknown public value;/m);
    });

    describe('with an unreachable setter hashed public variable', function () {
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
