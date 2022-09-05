import { expect } from 'chai';
import { SStore, Stop, Sha3, Symbol0, Add, CallDataLoad, Return, SLoad } from '../../src/ast';
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

        it('should find `SStore`s in blocks', () => {
            const { blocks } = evm.getBlocks();

            const sstores = Object.values(blocks)
                .map(block => block.stmts)
                .filter(stmts => stmts.find(stmt => stmt instanceof SStore));

            expect(sstores).to.be.of.length(2);
            expect(sstores.map(stmts => stmts.length)).to.be.deep.equal([2, 2]);
            expect(sstores.map(stmts => stmts.at(-1))).to.be.deep.equal([new Stop(), new Stop()]);

            const location = new Sha3([new Symbol0('msg.sender'), 0n]);
            const data = (value: bigint) => new Add(new CallDataLoad(4n), value);
            const variables = evm.getContract().variables;
            expect(sstores.map(stmts => stmts[0])).to.be.deep.equal([
                new SStore(location, data(3n), variables),
                new SStore(location, data(5n), variables),
            ]);
        });

        it('should not have `mappings` nor `variables`', () => {
            const { mappings, variables } = evm.getContract();
            expect(Object.keys(mappings)).to.have.length(0);
            expect(Object.keys(variables)).to.have.length(0);
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
            const { blocks } = evm.getBlocks();
            const sloads = Object.values(blocks)
                .map(block => block.stmts.at(-1)!)
                .flatMap(stmt =>
                    stmt instanceof Return &&
                    stmt.args.length === 1 &&
                    stmt.args[0] instanceof SLoad
                        ? stmt.args[0]
                        : []
                );
            expect(sloads).to.be.of.length(2);

            expect(sloads[0].location).to.be.deep.equal(new Sha3([new Symbol0('msg.sender'), 0n]));
            expect(sloads[1].location).to.be.deep.equal(new Sha3([new CallDataLoad(4n), 0n]));
        });

        it('should not have `mappings` nor `variables`', () => {
            const { mappings, variables } = evm.getContract();
            expect(Object.keys(mappings)).to.have.length(0);
            expect(Object.keys(variables)).to.have.length(0);
        });

        it('should `decompile` bytecode', () => {
            const text = evm.decompile();
            expect(text, text).to.match(/return storage\[keccak256\(msg.sender, 0\)\];$/m);
            expect(text, text).to.match(/return storage\[keccak256\(_arg0, 0\)\];$/m);
        });
    });

    it('should decompile bytecode from `internal` method without inlining function', () => {
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
