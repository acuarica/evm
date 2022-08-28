import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('events', version => {
    it('should emit unknown event', () => {
        const CONTRACT = `contract C {
            event Event0(string);
            function emitEvent() external {
                emit Event0("Hello, world!");
            }
        }`;
        const evm = new EVM(compile('C', CONTRACT, version));
        expect(evm.getEvents()).to.be.empty;
        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(\d+(, \d+)+\);/);
    });

    it('should emit hashed event', () => {
        const CONTRACT = `contract C {
            event Transfer(uint256, address);
            function emitEvent() external {
                emit Transfer(123, address(this));
            }
        }`;
        const evm = new EVM(compile('C', CONTRACT, version));
        expect(evm.getEvents()).to.be.deep.equal(['Transfer(uint256,address)']);
        const text = evm.decompile();
        expect(text, text).to.match(/event Transfer\(uint256 _arg0, address _arg1\);$/m);
        expect(text, text).to.match(/emit Transfer\(123, this\);$/m);
    });

    it('should emit hashed event with no arguments', () => {
        const CONTRACT = `contract C {
            event Transfer();
            function f() external {
                emit Transfer();
            }
        }`;
        const evm = new EVM(compile('C', CONTRACT, version));
        expect(evm.getEvents()).to.be.deep.equal(['Transfer()']);
        const text = evm.decompile();
        expect(text, text).to.match(/event Transfer\(\)$/m);
        expect(text, text).to.match(/emit Transfer\(\);$/m);
    });
});
