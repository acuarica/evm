import { expect } from 'chai';

import { Contract } from 'sevm';

import { contracts } from '../utils/solc';

contracts('require', compile => {
    it('should `decompile` contract with `require`s', function () {
        const src = `contract Test {
            mapping (address => uint256) private _allowances;
            function approve(uint256 amount) external {
                _approve(msg.sender, amount);
            }
            function _approve(address owner, uint256 amount) private {
                require(owner != address(0), "approve");
                require(amount > 0, "approve address");
                _allowances[owner] = amount;
            }
        }`;
        const contract = new Contract(compile(src, this).bytecode).reduce();
        const text = contract.solidify();
        expect(text, text).to.match(/require(\()+msg.sender/);
        expect(text, text).to.match(/require\(_arg0 > 0x0, /);
    });
});
