import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('dispatch', version => {
    it('should `decompile` a contract with a single `external` method', () => {
        const CONTRACT = `contract Contract {
            function get() external pure returns (uint256) {
                return 5;
            }
        }`;
        const evm = new EVM(compile('Contract', CONTRACT, version));
        expect(evm.getFunctions()).to.be.include.members(['get()']);

        expect(Object.keys(evm.contract.functions)).to.be.of.length(1);

        const [[hash, fn]] = Object.entries(evm.contract.functions);

        expect(hash).to.be.equal('6d4ce63c');
        expect(fn.label).to.be.equal('get()');

        const text = evm.decompile();
        expect(text, `decompiled bytecode\n${text}`).to.match(
            /function get\(\) public view payable/
        );
    });

    it('should `decompile` a contract with multiple `external` functions', () => {
        const CONTRACT = `contract Contract {
            function balanceOf(uint256 from) external pure returns (uint256) { return from; }
            function symbol() external pure returns (uint256) { return 3; }
            function thisAddress() external view returns (address) { return address(this); }
        }`;
        const evm = new EVM(compile('Contract', CONTRACT, version));
        expect(evm.getFunctions()).to.include.members([
            'balanceOf(uint256)',
            'symbol()',
            'thisAddress()',
        ]);

        expect(Object.keys(evm.contract.functions)).to.be.of.length(3);

        const fn = evm.contract.getFunction('balanceOf(uint256)');
        // expect(fn.stmts.filter(stmt => stmt instanceof Require).length).to.be.greaterThan(0);
        expect(fn).to.not.be.undefined;
        // expect(fn!.stmts).to.be.deep.equal([]);
        // expect(fn!.stmts.at(-1)).instanceOf(Return);

        const text = evm.decompile();
        expect(text, `decompiled bytecode\n${text}`).to.match(/return this;$/m);
    });
});
