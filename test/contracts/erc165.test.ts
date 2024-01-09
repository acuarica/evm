import { keccak_256 } from '@noble/hashes/sha3';
import { expect } from 'chai';

import { Contract } from 'sevm';

import { contracts } from '../utils/solc';

contracts('erc165', compile => {
    it('CHECK `keccak_256` hash selector for `supportsInterface(bytes4)`', function () {
        const sig = 'supportsInterface(bytes4)';
        const hash = Buffer.from(keccak_256(sig).slice(0, 4)).toString('hex');
        expect(hash).to.be.equal('01ffc9a7');
    });

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
