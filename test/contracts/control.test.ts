import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('control', (version, fallback) => {
    it('should `decompile` contract with `if` no-else', () => {
        const CONTRACT = `contract C {
            uint256 total = 0;
            ${fallback}() external payable {
                uint256 val = 0;
                if (block.number == 8) {
                    val = 3;
                }
                val += 5;
            }
        }`;
        const evm = new EVM(compile(CONTRACT, version));

        const text = evm.decompile();
        expect(text, text).to.match(/block\.number/);
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
        const evm = new EVM(compile(CONTRACT, version));

        const text = evm.decompile();
        expect(text, text).to.match(/require(\()+msg.sender/);
        expect(text, text).to.match(/require\(\(_arg0 > 0\), /);
    });
});
