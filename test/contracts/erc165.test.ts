import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { solc } from './utils/solc';

const CONTRACT = `
contract C {
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return (interfaceID == 0xffffffff);
    }
}`;

describe('contracts::erc165', () => {
    let evm: EVM;

    before(() => {
        evm = new EVM(solc('C', CONTRACT));
    });

    it('should detect ERC165', () => {
        expect(evm.isERC165()).to.be.true;
    });
});
