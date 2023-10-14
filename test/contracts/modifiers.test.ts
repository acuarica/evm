import { expect } from 'chai';

import { Contract } from 'sevm';

import { contracts } from '../utils/solc';

contracts('modifiers', (compile, _fallback, version) => {
    describe('with a `modifier` calling an `internal` function', function () {
        let contract: Contract;

        before(function () {
            const src = `contract Test {
                uint256 private _value;
                address private _owner;
                constructor() ${['0.7.6', '0.8.16'].includes(version) ? '' : 'public '}{
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
            contract = new Contract(compile(src, this).bytecode);
        });

        it('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.not.match(/return msg.sender;/);
            expect(text, text).to.match(/storage\[0x1\] == msg.sender/m);
            expect(text, text).to.match(/var1 = _arg0 \+ 0x3;$/m);
        });
    });
});
