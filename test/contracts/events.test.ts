import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('events', (compile, fallback) => {
    it('should emit unknown event', () => {
        const CONTRACT = `contract C {
            event Event0(string);
            function emitEvent() external {
                emit Event0("Hello, world!");
            }
        }`;
        const evm = new EVM(compile(CONTRACT));
        expect(evm.getEvents()).to.be.empty;
        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(\d+(, \d+)+\);/);
    });

    it('should emit hashed event', () => {
        const CONTRACT = `contract C {
            event Transfer(uint256, address);
            function f(uint256 value) external {
                uint256 newValue = value + 0x123;
                emit Transfer(newValue, address(this));
            }
        }`;
        const evm = new EVM(compile(CONTRACT));
        expect(evm.getEvents()).to.be.deep.equal(['Transfer(uint256,address)']);
        const text = evm.decompile();
        expect(text, text).to.match(/event Transfer\(uint256 _arg0, address _arg1\);$/m);
        expect(text, text).to.match(/emit Transfer\(_arg0 \+ 123, this\);$/m);
    });

    it('should emit hashed event with indexed topics', () => {
        const CONTRACT = `contract C {
            event Send(uint256, address indexed);
            function f() external {
                emit Send(123, address(this));
            }
        }`;
        const evm = new EVM(compile(CONTRACT));
        expect(evm.getEvents()).to.be.deep.equal(['Send(uint256,address)']);
        const text = evm.decompile();
        expect(text, text).to.match(/event Send\(uint256 indexed _arg0, address _arg1\);$/m);
        expect(text, text).to.match(/emit Send\(this, 123\);$/m);
    });

    it('should emit hashed event with no arguments', () => {
        const CONTRACT = `contract C {
            event Transfer();
            function f() external {
                emit Transfer();
            }
        }`;
        const evm = new EVM(compile(CONTRACT));
        expect(evm.getEvents()).to.be.deep.equal(['Transfer()']);
        const text = evm.decompile();
        expect(text, text).to.match(/event Transfer\(\)$/m);
        expect(text, text).to.match(/emit Transfer\(\);$/m);
    });

    it('should emit anonymous event', () => {
        const CONTRACT = `contract C {
            event Transfer(uint256, address) anonymous;
            function f() external {
                emit Transfer(123, address(this));
            }
        }`;
        const evm = new EVM(compile(CONTRACT));
        expect(evm.getEvents()).to.be.deep.equal([]);
        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(123, this\);$/m);
    });

    it('should emit anonymous event with no arguments', () => {
        const CONTRACT = `contract C {
            event Transfer() anonymous;
            function f() external {
                emit Transfer();
            }
        }`;
        const evm = new EVM(compile(CONTRACT));
        expect(evm.getEvents()).to.be.deep.equal([]);
        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(\);$/m);
    });

    it('should emit anonymous event with both arguments and no arguments', () => {
        const CONTRACT = `contract C {
            event Transfer() anonymous;
            event Send(uint256, uint256) anonymous;
            ${fallback}() external payable {
                emit Transfer();
                emit Send(123, 124);
            }
        }`;
        const evm = new EVM(compile(CONTRACT));
        expect(evm.getEvents()).to.be.deep.equal([]);

        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(\);$/m);
        expect(text, text).to.match(/log\(123, 124\);$/m);
    });
});
