import { expect } from 'chai';

import { Contract } from 'sevm';

import { cfg } from './utils/cfg';
import { compile } from './utils/solc';

describe('::contracts', function () {
    const _ = (title: string, src: string) => ({ title, src });

    Object.entries<{ title: string, src: string }[]>({
        empty: [
            _('with no functions', `contract Test { }`),
        ],
        locals: [
            _('no dedup local var', `contract Test {
                event Deposit(uint256);
                fallback () external payable {
                    uint256 n = block.number;
                    emit Deposit(n);
                    emit Deposit(n);
                }
            }`),
        ],
        dispatch: [
            _('pure functions', `contract Test {
                function get() external pure returns (uint256) { return 1; }
                function getPayable() external payable returns (uint256) { return 1; }
            }`),
            _('symbols', `contract Test {
                function getBlockHash() public view returns (bytes32) { return blockhash(7); }
                function getBalance(address eoa) public view returns (uint256) { return eoa.balance; }
                function getThis() public view returns (address) { return address(this); }
            }`),
        ],
        mappings: [
            _('public mapping', `contract Test {
                mapping (address => mapping (address => uint256)) public allowance;
                function getValue() external view returns (uint256) {
                    return allowance[msg.sender][msg.sender];
                }
            }`),
        ],
        variables: [
            _('public unused var', `contract Test { uint256 public value; }`),
            _('public var set by internal fn', `contract Test {
                uint256 public value;
                // This function is removed from bytecode
                function setValue0(uint256 newValue) internal { value = newValue; }
            }`),
        ],
        control: [
            _('if-else', `contract Test {
                uint256 value;
                fallback () external payable {
                    uint256 temp;
                    if (block.number == 7) {
                        temp = 3;
                    } else {
                        temp = 5;
                    }
                    value = temp;
                }
            }`),
            _('constant for-loop', `contract Test {
                event Deposit(uint256);
                fallback() external payable {
                    for (uint256 i = 0; i < 10; i++) emit Deposit(i);
                }
            }`),
            _('bounded for-loop', `contract Test {
                uint256 value;
                fallback() external payable {
                    for (uint256 i = 0; i < block.number; i++) value = i;
                }
            }`),
            _('infinite for-loop', `contract Test {
                event Deposit(uint256);
                fallback() external payable {
                    for (uint256 i = 0; i < block.number; ) emit Deposit(i);
                }
            }`),
            _('require', `contract Test {
                mapping (address => uint256) private _allowances;
                function approve(uint256 amount) external {
                    _approve(msg.sender, amount);
                }
                function _approve(address owner, uint256 amount) private {
                    require(owner != address(0), "approve");
                    require(amount > 0, "approve address");
                    _allowances[owner] = amount;
                }
            }`),
            _('modifier', `contract Test {
                uint256 private _value;
                address private _owner;
                function _msgSender() internal view returns (address) { return msg.sender; }
                modifier onlyOwner() {
                    require(_owner == _msgSender(), "Ownable: caller is not the owner");
                    _;
                } 
                function setWithNoModifier(uint256 value) external { _value = value + 1; }
                function setWithModifier(uint256 value) external onlyOwner { _value = value + 3; }
            }`),
        ],
        system: [
            _('selfdestruct', `contract Test {
                fallback() external payable {
                    selfdestruct(payable(msg.sender));
                }
            }`),
            _('create-codecopy', `contract Token {
                event Deposit(uint256 value);
                fallback() external payable {
                    emit Deposit(3);
                }
            }
            contract Test {
                fallback() external payable {
                    new Token();
                }
            }`),
        ],
    }).forEach(([group, contracts]) => {
        describe(group, function () {
            contracts.forEach(({ title, src }) => {
                [undefined, { optimizer: { enabled: true } }].forEach(options => {
                    const root = `contracts/${group}/${title}`;
                    const suffix = options === undefined ? '-no-opt' : '-opt';

                    describe(title + suffix, function () {
                        let contract: Contract;

                        before(function () {
                            contract = new Contract(compile(src, '0.7.6', this, options).bytecode).patchdb();
                        });

                        it(`should match Solidity snapshot`, function () {
                            expect(contract.solidify()).to.matchSnapshot('solidity', this, [root, suffix]);
                        });

                        it(`should match Yul snapshot`, function () {
                            expect(contract.yul()).to.matchSnapshot('yul', this, [root, suffix]);
                        });

                        it(`should match CFG snapshot`, function () {
                            expect(cfg(contract, title + suffix)).to.matchSnapshot('mermaid', this, [root, suffix]);
                        });

                        it(`should match errors`, function () {
                            const replacer = (_key: string, value: unknown) =>
                                typeof value === 'bigint' ? value.toString(16) : value;
                            const errors = JSON.stringify(contract.errors.map(e => e.err), replacer, 2);
                            expect(errors).to.matchSnapshot('errors', this, [root, suffix]);
                        });
                    });
                });
            });
        });
    });
});
