import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('control', (compile, fallback) => {
    it('should `decompile` contract with `if` no-else', function () {
        const CONTRACT = `contract C {
            uint256 total = 0;
            ${fallback}() external payable {
                // uint256 val = 0;
                if (block.number == 8) {
                    total = 3;
                }
                total += 5;
            }
        }`;
        const evm = new EVM(compile(CONTRACT, this));

        const text = evm.decompile();
        expect(text, text).to.match(/block\.number/);
        expect(text, `decompiled bytecode\n${text}`).to.match(/bilock\.number/);
    });

    it('should `decompile` contract with `require`s', () => {
        const CONTRACT = `contract C {
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
        const evm = new EVM(compile(CONTRACT));

        const text = evm.decompile();
        expect(text, text).to.match(/require(\()+msg.sender/);
        expect(text, text).to.match(/require\(\(_arg0 > 0\), /);
    });
});
