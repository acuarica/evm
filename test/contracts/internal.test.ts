import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, solcs, VERSIONS } from './utils/solc';

describe('contracts::internal', () => {
    VERSIONS.forEach(version => {
        describe(`using solc-v${solcs[version].version()}`, () => {
            let evm: EVM;

            before(() => {
                const CONTRACT = `contract C {
                    mapping(address => uint256) private _values;
                    function _msgSender() internal view returns (address) {
                        return msg.sender;
                    }
                    function setInline(uint256 value) external {
                        _values[msg.sender] = value + 3;
                    }
                    function setInternal(uint256 value) external {
                        _values[_msgSender()] = value + 3;
                    }
                }`;
                evm = new EVM(compile('C', CONTRACT, version));
            });

            it('should decompile bytecode', () => {
                const text = evm.decompile();
                expect(text, text).to.not.match(/return msg.sender;/);
                expect(text, text).to.match(
                    /storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 3\)/
                );
            });
        });
    });
});
