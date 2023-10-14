import { expect } from 'chai';

import { Contract, toHex } from 'sevm';
import { Return } from 'sevm/ast';

import { fnselector } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('dispatch', compile => {
    it("should decompile function's return type and non-payable", function () {
        const src = `contract Test {
            function get() external pure returns (uint256) { return 5; }
        }`;
        const contract = new Contract(compile(src, this).bytecode).patchfns('get()');
        const text = contract.decompile();
        expect(text, `decompiled text\n${text}`).to.match(
            /^function get\(\) public view returns \(uint256\) {$/m
        );
    });

    it('should `decompile` a contract with a single `external` method', function () {
        const src = `contract Test {
            function set() external payable { }
            function get() external pure returns (uint256) { return 5; }
        }`;
        const contract = new Contract(compile(src, this).bytecode).patchfns('get()');
        const text = contract.decompile();
        expect(text, `decompiled text\n${text}`).to.match(
            /^function get\(\) public view returns \(uint256\) {$/m
        );
    });

    it('should `decompile` a contract with multiple `external` functions', function () {
        const src = `contract Test {
            function balanceOf(uint256 from) external pure returns (uint256) { return from; }
            function symbol() external pure returns (uint256) { return 3; }
            function thisAddress() external view returns (address) { return address(this); }
        }`;
        const contract = new Contract(compile(src, this).bytecode).patchfns(
            'balanceOf(uint256)',
            'symbol()',
            'thisAddress()'
        );
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

    it('should detect selectors only reachable functions', function () {
        const sig = 'balanceOf(uint256)';
        const src = `interface IERC20 {
            function ${sig} external view returns (uint256);
        }

        contract Test {
            function get() external view returns (uint256) {
                IERC20 addr = IERC20 (0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359);
                return addr.balanceOf(7);
            }
        }`;
        const contract = new Contract(compile(src, this).bytecode);

        const selector = fnselector(sig);
        const push4 = contract.evm.opcodes.find(
            o => o.mnemonic === 'PUSH4' && toHex(o.pushData) === selector
        );
        expect(push4, `PUSH4 for ${selector} should be in bytecode`).to.be.not.undefined;

        expect(contract.functions).to.have.keys(fnselector('get()'));
    });
});
