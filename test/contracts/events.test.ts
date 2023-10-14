import { expect } from 'chai';

import { Contract } from 'sevm';

import { eventSelector } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('events', (compile, fallback) => {
    it('should emit unknown event', function () {
        const src = `contract Test {
            event Event0(string);
            function emitEvent() external {
                emit Event0("Hello, world!");
            }
        }`;
        const contract = new Contract(compile(src, this).bytecode);
        const Event0 = eventSelector('Event0(string)');
        expect(contract.evm.events).to.have.keys(Event0);
        const text = contract.decompile();
        expect(text, text).to.match(/event /);
        expect(text, text).to.match(/log\(0x[a-fA-F\d]+(, 0x[a-fA-F\d]+)+\);/);
    });

    it('should emit hashed event', function () {
        const src = `contract Test {
            event Transfer(uint256, address);
            function f(uint256 value) external {
                uint256 newValue = value + 0x123;
                emit Transfer(newValue, address(this));
            }
        }`;
        const contract = new Contract(compile(src, this).bytecode).patchevs(
            'Transfer(uint256,address)'
        );
        expect(contract.getEvents()).to.be.deep.equal(['Transfer(uint256,address)']);
        const text = contract.decompile();
        expect(text, text).to.match(/event Transfer\(uint256 _arg0, address _arg1\);$/m);
        expect(text, text).to.match(/emit Transfer\(_arg0 \+ 0x123, address\(this\)\);$/m);
    });

    it('should emit hashed event with indexed topics', function () {
        const src = `contract Test {
            event Send(uint256, address indexed);
            function f() external {
                emit Send(123, address(this));
            }
        }`;
        const contract = new Contract(compile(src, this).bytecode).patchevs(
            'Send(uint256,address)'
        );
        expect(contract.getEvents()).to.be.deep.equal(['Send(uint256,address)']);
        const text = contract.decompile();
        expect(text, text).to.match(/event Send\(uint256 indexed _arg0, address _arg1\);$/m);
        expect(text, text).to.match(/emit Send\(address\(this\), 0x7b\);$/m);
    });

    it('should emit hashed event with no arguments', function () {
        const src = `contract Test {
            event Transfer();
            function f() external {
                emit Transfer();
            }
        }`;
        const contract = new Contract(compile(src, this).bytecode).patchevs('Transfer()');
        expect(contract.getEvents()).to.be.deep.equal(['Transfer()']);
        const text = contract.decompile();
        expect(text, text).to.match(/event Transfer\(\);$/m);
        expect(text, text).to.match(/emit Transfer\(\);$/m);
    });

    it('should emit anonymous event', function () {
        const src = `contract Test {
            event Transfer(uint256, address) anonymous;
            function f() external {
                emit Transfer(123, address(this));
            }
        }`;
        const evm = new Contract(compile(src, this).bytecode);
        expect(evm.getEvents()).to.be.deep.equal([]);
        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(0x7b, address\(this\)\);$/m);
    });

    it('should emit anonymous event with no arguments', function () {
        const src = `contract Test {
            event Transfer() anonymous;
            function f() external {
                emit Transfer();
            }
        }`;
        const evm = new Contract(compile(src, this).bytecode);
        expect(evm.getEvents()).to.be.deep.equal([]);
        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(\);$/m);
    });

    it('should emit anonymous event with both arguments and no arguments', function () {
        const src = `contract Test {
            event Transfer() anonymous;
            event Send(uint256, uint256) anonymous;
            ${fallback}() external payable {
                emit Transfer();
                emit Send(123, 124);
            }
        }`;
        const evm = new Contract(compile(src, this).bytecode);
        expect(evm.getEvents()).to.be.deep.equal([]);

        const text = evm.decompile();
        expect(text, text).to.not.match(/event/);
        expect(text, text).to.match(/log\(\);$/m);
        expect(text, text).to.match(/log\(0x7b, 0x7c\);$/m);
    });
});
