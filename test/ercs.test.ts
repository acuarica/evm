import { keccak256 } from 'js-sha3';
import { expect } from 'chai';

import { Contract } from 'sevm';

import { compile } from './utils/solc';

describe('::ercs', function () {
    describe('erc165', function () {
        it('check `keccak_256` hash selector for `supportsInterface(bytes4)`', function () {
            const sig = 'supportsInterface(bytes4)';
            const hash = keccak256(sig).slice(0, 8);
            expect(hash).to.be.equal('01ffc9a7');
        });

        it('should detect ERC165', function () {
            const src = `contract Test {
                function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
                    return (interfaceID == 0xffffffff);
                }
            }`;
            const contract = new Contract(compile(src, '0.8.21', this).bytecode);
            expect(contract.isERC('ERC165')).to.be.true;
        });

        it('should detect non-ERC165', function () {
            const src = `contract Test {
                function supportsInterface2(bytes4 interfaceID) external pure returns (bool) {
                    return (interfaceID == 0xffffffff);
                }
            }`;
            const contract = new Contract(compile(src, '0.8.21', this).bytecode);
            expect(contract.isERC('ERC165')).to.be.false;
        });
    });
});
