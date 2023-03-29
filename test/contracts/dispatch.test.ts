import { expect } from 'chai';
import { Contract } from '../../src';
import { Return } from '../../src/evm/system';
import { fnselector, patch } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('dispatch', compile => {
    it("should decompile function's return type and non-payable", function () {
        const sol = `contract C {
            function get() external pure returns (uint256) { return 5; }
        }`;
        const contract = new Contract(compile(sol, this).bytecode).patch();
        const text = contract.decompile();
        expect(text, `decompiled text\n${text}`).to.match(
            /^function get\(\) public view returns \(uint256\) {$/m
        );
    });

    it('should `decompile` a contract with a single `external` method', function () {
        const sol = `contract C {
            function set() external payable { }
            function get() external pure returns (uint256) { return 5; }
        }`;
        const contract = new Contract(compile(sol, this).bytecode).patch();
        const text = contract.decompile();
        expect(text, `decompiled text\n${text}`).to.match(
            /^function get\(\) public view returns \(uint256\) {$/m
        );
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

        const fn = contract.functions[fnselector('balanceOf(uint256)')];
        expect(fn.stmts.filter(stmt => stmt.name === 'Require').length).to.be.greaterThan(0);
        expect(fn.stmts.at(-1)).instanceOf(Return);

        const text = contract.decompile();
        expect(text, `decompiled bytecode\n${text}`).to.match(/return address\(this\);$/m);
    });
});
