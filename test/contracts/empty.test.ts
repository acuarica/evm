import { expect } from 'chai';
import { Contract } from '../../src';
import type { EVM } from '../../src/evm';
import { Revert } from '../../src/evm/system';
import { contracts } from '../utils/solc';

contracts('empty', (compile, _fallback, version) => {
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
    ] as const;

    CONTRACTS.forEach(([name, sol], index) => {
        describe(name, () => {
            let contract: Contract;
            let evm: EVM;

            before(function () {
                contract = new Contract(compile(sol, this).bytecode);
                evm = contract.evm;
            });

            it(`should get metadata hash for minimal contract definition`, () => {
                const HASHES = {
                    '0.5.5': [
                        'bzzr',
                        '096a513e029cd483d2b09f7149099a6290d4ad077ecc811a012c5e7fc25514cd',
                    ],
                    '0.5.17': [
                        'bzzr',
                        'b3196c0c582734d74810ef2241e728f6b83b6aa79d5f53732f29849c4bb4a25a',
                    ],
                    '0.6.12': [
                        'ipfs',
                        '12205823235d39a19a144ca0a76bbdf1e6ee8280514a68113e2c59bf79dd6000b767',
                    ],
                    '0.7.6': [
                        'ipfs',
                        '12206f1628c622f5b88ce2fc0b4eb82036ef4a13488b80241c68fb8cd209fc59f641',
                    ],
                    '0.8.16': [
                        'ipfs',
                        '122097ffe1485d914b655bdfa0b69dd73c107ff8a82b6e5dd22b6b11dbaac16b428a',
                    ],
                } as const;

                expect(evm.metadata).to.be.not.undefined;

                const hash = HASHES[version];
                expect(evm.metadata!.protocol).to.be.equal(hash[0]);
                expect(evm.metadata!.solc).to.be.equal(version === '0.5.5' ? '<0.5.9' : version);

                if (index === 0) {
                    expect(evm.metadata!.hash).to.be.equal(hash[1]);
                    expect(evm.metadata!.url).to.be.equal(`${hash[0]}://${hash[1]}`);
                }
            });

            it('should not contain `LOG1` nor `LOG2` given metadata has been stripped', () => {
                expect(evm.opcodes.map(op => op.mnemonic)).to.be.deep.equal([
                    'PUSH1',
                    'PUSH1',
                    'MSTORE',
                    'PUSH1',
                    'DUP1',
                    'REVERT',
                    'INVALID',
                ]);
            });

            it('should not have functions nor events', () => {
                expect(contract.functions).to.be.empty;
                expect(evm.functionBranches).to.be.empty;
                expect(evm.events).to.be.empty;
            });

            it('should have 1 block & 1 `revert`', () => {
                expect(contract.evm.chunks).to.be.of.length(1);
                const chunk = contract.evm.chunks.get(0)!;
                expect(evm.opcodes[chunk.pcend - 1]!.mnemonic).to.be.equal('REVERT');
                expect(chunk.states).to.be.of.length(1);
                const state = chunk.states[0]!;
                expect(state.last).to.be.deep.equal(new Revert([]));

                expect(contract.main.length).to.be.at.least(1);
                expect(contract.main.at(-1)).to.be.deep.equal(new Revert([]));
            });

            it('should `decompile` bytecode', () => {
                expect(contract.decompile()).to.be.equal('revert();\n');
            });
        });
    });
});
