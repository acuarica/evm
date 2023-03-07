import { expect } from 'chai';
import { EVM, ast, OPCODES } from '../../src';
import { contract } from './utils/solc';

contract('empty', (compile, _fallback, version) => {
    const CONTRACTS = [
        ['with no functions', `contract Empty { }`],
        [
            'with `internal` unused function',
            `contract Empty {
                function get() internal pure returns (uint256) {
                    return 5;
                }
            }`,
        ],
        [
            'with `internal` unused function emitting an event',
            `contract Empty {
                event Transfer(uint256, address);
                function get() internal {
                    emit Transfer(3, address(this));
                }
            }`,
        ],
        [
            'with a private variable and no usages',
            `contract Empty {
                uint256 private value;
            }`,
        ],
        [
            'with a private variable and unreachable usages',
            `contract Empty {
                uint256 private value;
                function setValue(uint256 newValue) internal {
                    value = newValue;
                }
            }`,
        ],
    ];

    CONTRACTS.forEach(([name, CONTRACT], index) => {
        describe(name, () => {
            let evm: EVM;

            before(() => {
                evm = new EVM(compile(CONTRACT).deployedBytecode, {}, {});
            });

            if (index === 0) {
                const HASHES = {
                    '0.5.5':
                        'bzzr://096a513e029cd483d2b09f7149099a6290d4ad077ecc811a012c5e7fc25514cd',
                    '0.5.17':
                        'bzzr://b3196c0c582734d74810ef2241e728f6b83b6aa79d5f53732f29849c4bb4a25a',
                    '0.6.12':
                        'ipfs://12205823235d39a19a144ca0a76bbdf1e6ee8280514a68113e2c59bf79dd6000b767',
                    '0.7.6':
                        'ipfs://12206f1628c622f5b88ce2fc0b4eb82036ef4a13488b80241c68fb8cd209fc59f641',
                    '0.8.16':
                        'ipfs://122097ffe1485d914b655bdfa0b69dd73c107ff8a82b6e5dd22b6b11dbaac16b428a',
                };
                it(`should get metadata hash ${HASHES[version]} minimal contract definition`, () => {
                    expect(evm.metadataHash).to.be.equal(HASHES[version]);
                });
            }

            it('should not contain `LOG1` nor `LOG2` because metadata has been stripped', () => {
                expect(evm.opcodes).to.have.length(7);
                expect(evm.opcodes[0].mnemonic).to.be.equal('PUSH1');
                expect(evm.opcodes[1].mnemonic).to.be.equal('PUSH1');
                expect(evm.opcodes[2].mnemonic).to.be.equal('MSTORE');
                expect(evm.opcodes[3].mnemonic).to.be.equal('PUSH1');
                expect(evm.opcodes[4].mnemonic).to.be.equal('DUP1');
                expect(evm.opcodes[5].mnemonic).to.be.equal('REVERT');
                expect(evm.opcodes[6].mnemonic).to.be.equal('INVALID');
            });

            it('should not have functions nor events', () => {
                expect(evm.getFunctions()).to.be.empty;
                expect(evm.getEvents()).to.be.empty;
            });

            it('should `getBlocks` with 1 block & `revert`', () => {
                expect(Object.keys(evm.contract.main.cfg.blocks)).to.be.length(1);

                const block = evm.contract.main.cfg.blocks[evm.contract.main.cfg.entry];
                expect(block.end.opcode).to.be.equal(OPCODES.REVERT);
                expect(block.stmts.length).to.be.at.least(1);
                expect(block.stmts.at(-1)).to.be.deep.equal(new ast.Revert([]));

                expect(Object.keys(evm.contract.functions)).to.be.length(0);
            });

            it('should `decompile` bytecode', () => {
                expect(evm.decompile()).to.be.equal('revert();\n');
            });
        });
    });
});
