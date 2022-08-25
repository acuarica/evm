import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile } from './utils/solc';

describe('contracts::internal', () => {
    describe('internal', () => {
        const CONTRACT = `// SPDX-License-Identifier: MIT
        pragma solidity 0.8.16;

        abstract contract Context {
            function _msgSender() internal view virtual returns (address) {
                return msg.sender;
            }
        
            function _msgData() internal view virtual returns (bytes calldata) {
                this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
                return msg.data;
            }
        }

        contract Ownable is Context {
            address private _owner;
            
            constructor () {
                address msgSender = _msgSender();
                _owner = msgSender;
            }
        
            function owner() public view returns (address) {
                return _owner;
            }
        
            modifier onlyOwner() {
                require(_owner == _msgSender(), "Ownable: caller is not the owner");
                _;
            } 
        }

        contract Contract is Ownable {
            mapping(address => uint256) private _values;
            function set0(uint256 value) external {
                _values[_msgSender()] = value + 0;
            }
            function set1(uint256 value) external onlyOwner {
                _values[_msgSender()] = value + 1;
            }
            function set2(uint256 value) external {
                _values[_msgSender()] = value + 2;
            }
            function set3(uint256 value) external onlyOwner {
                _values[_msgSender()] = value + 3;
            }
        }`;

        let evm: EVM;

        before(() => {
            evm = new EVM(compile('Contract', CONTRACT, '0.8.16'));
        });

        it('should decompile functions', () => {
            console.log(evm.decompile());
            expect(evm.decompile()).to.match(/function get\(\) public view payable/);
        });
    });
});
