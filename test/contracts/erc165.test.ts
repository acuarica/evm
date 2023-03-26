import { expect } from 'chai';
import { Contract } from '../../src';
import { contracts } from '../utils/solc';

contracts('erc165', compile => {
    it('should detect ERC165', function () {
        const sol = `contract C {
                function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
                    return (interfaceID == 0xffffffff);
                } }`;
        const contract = new Contract(compile(sol, this).bytecode);
        expect(contract.isERC165()).to.be.true;
    });

    it('should detect not-ERC165', function () {
        const sol = `contract C {
                function supportsInterface2(bytes4 interfaceID) external pure returns (bool) {
                    return (interfaceID == 0xffffffff);
                } }`;
        const contract = new Contract(compile(sol, this).bytecode);
        expect(contract.isERC165()).to.be.false;
    });
});
