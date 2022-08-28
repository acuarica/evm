import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('internal', version => {
    it('should decompile bytecode from `internal` method with no arguments', () => {
        const CONTRACT = `contract C {
            mapping(address => uint256) private _values;
            function _msgSender() internal view returns (address) {
                return msg.sender;
            }
            function setInline(uint256 value) external {
                _values[msg.sender] = value + 3;
            }
            function setInternal(uint256 value) external {
                _values[_msgSender()] = value + 5;
            }
        }`;
        const evm = new EVM(compile('C', CONTRACT, version));

        const text = evm.decompile();
        expect(text, text).to.not.match(/return msg.sender;/);
        expect(text, text).to.match(/storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 3\)/);
        expect(text, text).to.match(/storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 5\)/);
    });

    it('should decompile bytecode from `internal` method with different arguments', () => {
        const CONTRACT = `contract C {
                    mapping(address => uint256) private _values;
                    function _getValue(address from) internal view returns (uint256) {
                        return _values[from];
                    }
                    function getForSender() external view returns (uint256) {
                        return _getValue(msg.sender);
                    }
                    function getForArg(address from) external view returns (uint256) {
                        return _getValue(from);
                    }
                }`;
        const evm = new EVM(compile('C', CONTRACT, version));

        const text = evm.decompile();
        expect(text, text).to.match(/return storage\[keccak256\(msg.sender, 0\)\];$/m);
        expect(text, text).to.match(/return storage\[keccak256\(_arg0, 0\)\];$/m);
    });

    it.skip('should decompile bytecode from `internal` method without inlining function', () => {
        const CONTRACT = `contract C {
                    mapping(uint256 => uint256) private _values;
                    function _getValue(uint256 n) internal view returns (uint256) {
                        uint256 result = 0;
                        for (uint256 i = 0; i < n; i++) {
                            result += _values[i];
                        }
                        return result;
                    }
                    function getFor5() external view returns (uint256) {
                        return _getValue(5);
                    }
                    function getForArg(uint256 n) external view returns (uint256) {
                        return _getValue(n);
                    }
                }`;
        const evm = new EVM(compile('C', CONTRACT, version));

        const text = evm.decompile();
        expect(text, text).to.match(/storage\[keccak256\(0, 0\)\]/);
    });
});
