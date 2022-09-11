import { expect } from 'chai';
import { FunctionFragment, Interface } from 'ethers/lib/utils';
import { SStore, Stop, Sha3, Symbol0, Add, CallDataLoad } from '../../src/ast';
import EVM from '../utils/evmtest';
import { compile, contract } from './utils/solc';

contract('internal', version => {
    describe('with `internal` method with no arguments', () => {
        let evm: EVM;

        before(() => {
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
            evm = new EVM(compile('C', CONTRACT, version));
        });

        [
            { sig: 'setInline(uint256)', value: 3n },
            { sig: 'setInternal(uint256)', value: 5n },
        ].forEach(({ sig, value }) => {
            const hash = Interface.getSighash(FunctionFragment.from(sig)).substring(2);
            it(`should find \`SStore\`s in \`#${hash}\`\`${sig}\` blocks`, () => {
                const fn = evm.contract.functions[hash];

                expect(fn).to.not.be.undefined;

                expect(fn.stmts.at(-2)).to.be.deep.equal(
                    new SStore(
                        new Sha3([new Symbol0('msg.sender'), 0n]),
                        new Add(new CallDataLoad(4n), value),
                        evm.contract.variables
                    )
                );
                expect(fn.stmts.at(-1)).to.be.deep.equal(new Stop());
            });
        });

        it('should not have `mappings` nor `variables`', () => {
            expect(Object.keys(evm.contract.mappings)).to.have.length(0);
            expect(Object.keys(evm.contract.variables)).to.have.length(0);
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.not.match(/return msg.sender;/);
            expect(text, text).to.match(/storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 3\)/);
            expect(text, text).to.match(/storage\[keccak256\(msg.sender, 0\)\] = \(_arg0 \+ 5\)/);
        });
    });

    describe('with `internal` method with different arguments', () => {
        let evm: EVM;

        before(() => {
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
            evm = new EVM(compile('C', CONTRACT, version));
        });

        it('should find `SLoad`s in blocks', () => {
            // const { blocks } = evm.getBlocks();
            // const sloads = Object.values(blocks)
            //     .map(block => block.stmts.at(-1)!)
            //     .flatMap(stmt =>
            //         stmt instanceof Return &&
            //             stmt.args.length === 1 &&
            //             stmt.args[0] instanceof SLoad
            //             ? stmt.args[0]
            //             : []
            //     );
            // expect(sloads).to.be.of.length(2);
            // expect(sloads[0].location).to.be.deep.equal(new Sha3([new Symbol0('msg.sender'), 0n]));
            // expect(sloads[1].location).to.be.deep.equal(new Sha3([new CallDataLoad(4n), 0n]));
        });

        it('should not have `mappings` nor `variables`', () => {
            expect(Object.keys(evm.contract.mappings)).to.have.length(0);
            expect(Object.keys(evm.contract.variables)).to.have.length(0);
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.match(/return storage\[keccak256\(msg.sender, 0\)\];$/m);
            expect(text, text).to.match(/return storage\[keccak256\(_arg0, 0\)\];$/m);
        });
    });

    describe('with `internal` method without inlining function', () => {
        let evm: EVM;

        before(() => {
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
            evm = new EVM(compile('C', CONTRACT, version));
        });

        it.skip('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.match(/storage\[keccak256\(0, 0\)\]/);
        });
    });
});
