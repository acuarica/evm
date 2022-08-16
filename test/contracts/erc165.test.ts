import { expect } from 'chai';
import EVM from '../utils/evmtest';
import Contract from './utils/solc';

const CONTRACT = `
pragma solidity 0.5.5;

contract Contract {
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return (interfaceID == 0xffffffff);
    }
}`;

describe('contracts::erc165', () => {
    let contract: Contract;
    let evm: EVM;

    before(() => {
        contract = new Contract();
        contract.load('erc165', CONTRACT);
        evm = new EVM(contract.bytecode());
    });

    it('should compile without errors', () => {
        expect(contract.valid(), contract.errors().join('\n')).to.be.true;
    });

    it('should detect ERC165', () => {
        expect(evm.isERC165()).to.be.true;
    });
});
