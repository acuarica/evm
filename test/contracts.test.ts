import { expect } from 'chai';

import { Contract } from 'sevm';

import { compile } from './utils/solc';

describe('::contracts', function () {

    Object.entries<{
        title: string,
        src: string,
        options?: Parameters<typeof compile>[3],
    }[]
    >({
        empty: [
            {
                title: 'with no functions',
                src: `contract Test { }`,
            },
        ],
        locals: [
            {
                title: 'no dedup local variable with emit',
                src: `contract Test {
                    event Deposit(uint256);
                    fallback () external payable {
                        uint256 n = block.number;
                        emit Deposit(n);
                        emit Deposit(n);
                    }
                }`
            },
            {
                title: 'no dedup local variable with emit optimized',
                src: `contract Test {
                    event Deposit(uint256);
                    fallback () external payable {
                        uint256 n = block.number;
                        emit Deposit(n);
                        emit Deposit(n);
                    }
                }`,
                options: { optimizer: { enabled: true } },
            }
        ],
        dispatch: [
            {
                title: 'pure payable and non-payable functions',
                src: `contract Test {
                    function get() external pure returns (uint256) { return 1; }
                    function getPayable() external payable returns (uint256) { return 1; }
                }`,
            },
            {
                title: 'pure payable and non-payable functions optimized',
                src: `contract Test {
                    function get() external pure returns (uint256) { return 1; }
                    function getPayable() external payable returns (uint256) { return 1; }
                }`,
                options: { optimizer: { enabled: true } },
            },
        ],
        mappings: [
            {
                title: 'pure payable and mappings',
                src: `contract Test {
                    mapping (address => mapping (address => uint256)) public allowance;
                    function getValue() external view returns (uint256) {
                        return allowance[msg.sender][msg.sender];
                    }
                }`,
            },
        ],
    }).forEach(([name, contracts]) => {
        describe(name, function () {
            contracts.forEach(({ title, src, options }) => {

                describe(title, function () {
                    let contract: Contract;

                    before(function () {
                        contract = new Contract(compile(src, '0.7.6', this, options).bytecode).patch();
                    });

                    it(`should match Solidity snapshot`, function () {
                        expect(contract.solidify()).to.matchSnapshot('solidity', this);
                    });

                    it(`should match Yul snapshot`, function () {
                        expect(contract.yul()).to.matchSnapshot('yul', this);
                    });
                });
            });
        });
    });

});
