import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('modifiers', (compile, _fallback, version) => {
    describe('with a `modifier` calling an `internal` function', () => {
        let evm: EVM;

        before(() => {
            const CONTRACT = `contract C {
                uint256 private _value;
                address private _owner;
                constructor() ${version === '0.8.16' ? '' : 'public '}{
                    address msgSender = _msgSender();
                    _owner = msgSender;
                }
                modifier onlyOwner() {
                    require(_owner == _msgSender(), "Ownable: caller is not the owner");
                    _;
                } 
                function _msgSender() internal view returns (address) {
                    return msg.sender;
                }
                function setWithNoModifier(uint256 value) external {
                    _value = value + 1;
                }
                function setWithModifier(uint256 value) external onlyOwner {
                    _value = value + 3;
                }
            }`;
            evm = new EVM(compile(CONTRACT));
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.not.match(/return msg.sender;/);
            expect(text, text).to.match(/storage\[1\] == msg.sender/m);
            expect(text, text).to.match(/var1 = \(_arg0 \+ 3\);$/m);
        });
    });
});
