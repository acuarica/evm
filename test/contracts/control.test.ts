import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('control', version => {
    it.skip('should `decompile` contract with `if` no-else', () => {
        const CONTRACT = `contract C {
            uint256 total = 0;
            function() external payable {
                uint256 val = 0;
                if (block.number == 8) {
                    val = 3;
                }
                val += 5;
            }
        }`;
        const evm = new EVM(compile('C', CONTRACT, version));
        const cfg = evm.contract.main.blocks[0];
        // cfg[cfg.entry]
    });

    it('should ', () => {
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
        const evm = new EVM(compile('C', CONTRACT, version));
        evm.contract;
    });
});
