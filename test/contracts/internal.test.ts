import { expect } from 'chai';
import { Contract, Require } from 'sevm';
import { Val } from '../../src/evm/expr';
import { Add } from '../../src/evm/math';
import { SLoad, SStore } from '../../src/evm/storage';
import { Msg, CallDataLoad } from '../../src/evm/special';
import { Return, Sha3, Stop } from '../../src/evm/system';
import { fnselector } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('internal', compile => {
    describe('with `internal` method with no arguments', function () {
        let contract: Contract;

        before(function () {
            const sol = `contract C {
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
            contract = new Contract(compile(sol, this).bytecode);
        });

        [
            { sig: 'setInline(uint256)', value: 3n },
            { sig: 'setInternal(uint256)', value: 5n },
        ].forEach(({ sig, value }) => {
            const selector = fnselector(sig);

            it.skip(`should find \`SStore\`s in \`#${selector}\`\`${sig}\` blocks`, function () {
                const fn = contract.functions[selector];

                expect(fn).to.not.be.undefined;

                expect(fn.stmts.at(-2)).to.be.deep.equal(
                    new SStore(
                        new Sha3([Msg.sender, new Val(0n)]),
                        new Add(new CallDataLoad(new Val(4n)), new Val(value)),
                        contract.evm.variables
                    )
                );
                expect(fn.stmts.at(-1)).to.be.deep.equal(new Stop());
            });
        });

        it('should not have `mappings` nor `variables`', function () {
            expect(Object.keys(contract.evm.mappings)).to.have.length(1);
            expect(Object.keys(contract.evm.variables)).to.have.length(0);
        });

        it.skip('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.not.match(/return msg.sender;/);
            expect(text, text).to.match(/storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 3\)/);
            expect(text, text).to.match(/storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 5\)/);
        });
    });

    describe('with `internal` method with different arguments', function () {
        let contract: Contract;

        before(function () {
            const sol = `contract C {
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
            contract = new Contract(compile(sol, this).bytecode);
        });

        [
            { sig: 'getForSender()', value: Msg.sender },
            { sig: 'getForArg(address)', value: new CallDataLoad(new Val(4n)) },
        ].forEach(({ sig, value }) => {
            const selector = fnselector(sig);

            it.skip('should find `SLoad`s in blocks', function () {
                const stmts = contract.functions[selector].stmts;
                expect(stmts.length).to.be.at.least(1);

                stmts.slice(0, -1).forEach(stmt => expect(stmt).to.be.instanceOf(Require));

                expect(stmts.at(-1)).to.be.deep.equal(
                    new Return([new SLoad(new Sha3([value, new Val(0n)]), contract.evm.variables)])
                );
            });
        });

        it('should not have `mappings` nor `variables`', function () {
            expect(Object.keys(contract.evm.mappings)).to.have.length(1);
            expect(Object.keys(contract.evm.variables)).to.have.length(0);
        });

        it.skip('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.match(/return storage\[keccak256\(msg.sender, 0\)\];$/m);
            expect(text, text).to.match(/return storage\[keccak256\(_arg0, 0\)\];$/m);
        });
    });

    describe('with `internal` method without inlining function', function () {
        let contract: Contract;

        before(function () {
            const sol = `contract C {
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
            contract = new Contract(compile(sol, this).bytecode);
        });

        it.skip('should `decompile` bytecode', function () {
            const text = contract.decompile();
            expect(text, text).to.match(/storage\[keccak256\(0, 0\)\]/);
        });
    });
});
