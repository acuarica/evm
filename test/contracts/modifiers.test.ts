import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile } from './utils/solc';

describe('contracts::modifiers', () => {
    describe('modifiers', () => {
        let evm: EVM;

        before(() => {
            evm = new EVM(
                compile(
                    'C',
                    `
                contract C {
                    uint256 private _value;
                    address private _owner;
                    constructor () {
                        address msgSender = _msgSender();
                        _owner = msgSender;
                    }
                    modifier onlyOwner() {
                        require(_owner == _msgSender(), "Ownable: caller is not the owner");
                        _;
                    } 
                    function _msgSender() internal view virtual returns (address) {
                        return msg.sender;
                    }
                    function setWithNoModifier(uint256 value) external {
                        _value = value + 1;
                    }
                    function setWithModifier(uint256 value) external onlyOwner {
                        _value = value + 3;
                    }
                }`,
                    '0.8.16'
                )
            );
        });

        it('should decompile bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.not.match(/return msg.sender;/);
            expect(text, text).to.match(/if\(storage\[1\] == msg.sender\) \{$/m);
            expect(text, text).to.match(/var1 = \(_arg0 \+ 3\);$/m);
        });
    });
});
