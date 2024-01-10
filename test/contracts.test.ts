import { expect } from 'chai';

import { Contract } from 'sevm';

import { compile } from './utils/solc';

describe('::contracts', function () {

    Object.entries({
        empty: [
            ['with no functions', `contract Test { }`],
        ],
        dispatch: [
            ['pure payable and non-payable functions', `contract Test {
                function get() external pure returns (uint256) { return 1; }
                function getPayable() external payable returns (uint256) { return 1; }
            }`],
        ],
    }).forEach(([name, contracts]) => {
        describe(name, function () {
            contracts.forEach(([title, src]) => {

                describe(title, function () {
                    let contract: Contract;

                    before(function () {
                        contract = new Contract(compile(src, '0.7.6', this).bytecode);
                    });

                    it(`should match Solidity snapshot`, function () {
                        expect(contract.solidify()).to.matchSnapshot('sol', this);
                    });

                    it(`should match Yul snapshot`, function () {
                        expect(contract.yul()).to.matchSnapshot('yul', this);
                    });
                });
            });
        });
    });

});
