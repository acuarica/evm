import { expect } from 'chai';

import { Contract } from 'sevm';

import { contracts } from '../utils/solc';

contracts('erc165', compile => {
    it('should detect ERC165', function () {
        const src = `contract Test {
                function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
                    return (interfaceID == 0xffffffff);
                } }`;
        const contract = new Contract(compile(src, this).bytecode);
        expect(contract.isERC('ERC165')).to.be.true;
    });

    it('should detect non-ERC165', function () {
        const src = `contract Test {
                function supportsInterface2(bytes4 interfaceID) external pure returns (bool) {
                    return (interfaceID == 0xffffffff);
                } }`;
        const contract = new Contract(compile(src, this).bytecode);
        expect(contract.isERC('ERC165')).to.be.false;
    });
});
