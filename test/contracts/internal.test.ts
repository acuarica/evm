import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile } from './utils/solc';

describe('contracts::internal', () => {
    describe('internal', () => {
        let evm: EVM;

        before(() => {
            evm = new EVM(
                compile(
                    'C',
                    `
                contract C {
                    mapping(address => uint256) private _values;
                    function _msgSender() internal view virtual returns (address) {
                        return msg.sender;
                    }
                    function setInline(uint256 value) external {
                        _values[msg.sender] = value + 3;
                    }
                    function setInternal(uint256 value) external {
                        _values[_msgSender()] = value + 3;
                    }
                }`,
                    '0.8.16'
                )
            );
        });

        it('should decompile functions', () => {
            const text = evm.decompile();
            expect(text, text).to.not.match(/return msg.sender;/);
            expect(text, text).to.match(/storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 3\)/);
        });
    });
});
