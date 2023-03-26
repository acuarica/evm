import { expect } from 'chai';
import { Contract } from '../../src';
import { patch } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('dispatch', compile => {
    it('should `decompile` a contract with a single `external` method', function () {
        const sol = `contract Contract {
            function get() external pure returns (uint256) {
                return 5;
            }
        }`;
        const contract = patch(new Contract(compile(sol, this).bytecode));

        expect(Object.keys(contract.functions)).to.be.of.length(1);

        const [[selector, fn]] = Object.entries(contract.functions);

        expect(selector).to.be.equal('6d4ce63c');
        expect(fn.label).to.be.equal('get()');

        const text = contract.decompile();
        expect(text, `decompiled text\n${text}`).to.match(/function get\(\) public view payable/);
    });

    it('should `decompile` a contract with multiple `external` functions', function () {
        const sol = `contract Contract {
            function balanceOf(uint256 from) external pure returns (uint256) { return from; }
            function symbol() external pure returns (uint256) { return 3; }
            function thisAddress() external view returns (address) { return address(this); }
        }`;
        const contract = patch(new Contract(compile(sol, this).bytecode));
        expect(contract.getFunctions()).to.include.members([
            'balanceOf(uint256)',
            'symbol()',
            'thisAddress()',
        ]);

        expect(Object.keys(contract.functions)).to.be.of.length(3);

        // const fn = contract.contract.getFunction('balanceOf(uint256)');
        // expect(fn.stmts.filter(stmt => stmt instanceof Require).length).to.be.greaterThan(0);
        // expect(fn).to.not.be.undefined;
        // expect(fn!.stmts).to.be.deep.equal([]);
        // expect(fn!.stmts.at(-1)).instanceOf(Return);

        const text = contract.decompile();
        expect(text, `decompiled bytecode\n${text}`).to.match(/return this;$/m);
    });
});
