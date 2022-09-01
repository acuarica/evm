import { expect } from 'chai';
import { OPCODES } from '../../src/opcode';
import EVM from '../utils/evmtest';
import { verifyBlocks } from '../utils/verify';
import { compile, contract } from './utils/solc';

contract('empty', version => {
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
    ];

    CONTRACTS.forEach(([name, CONTRACT], index) => {
        describe(name, () => {
            let evm: EVM;

            before(() => {
                evm = new EVM(compile('Empty', CONTRACT, version));
            });

            it('should have verified blocks', () => {
                verifyBlocks(evm);
            });

            it('should not contain LOG1 nor LOG2 because metadata has been stripped', () => {
                expect(evm.opcodes.map(op => op.mnemonic)).to.not.contain('LOG1');
                expect(evm.opcodes.map(op => op.mnemonic)).to.not.contain('LOG2');
            });

            it('should not have functions', () => {
                expect(evm.getFunctions()).to.be.empty;
            });

            it('should not have events', () => {
                expect(evm.getEvents()).to.be.empty;
            });

            if (index === 0) {
                const HASHES = {
                    '0.5.5':
                        'bzzr://096a513e029cd483d2b09f7149099a6290d4ad077ecc811a012c5e7fc25514cd',
                    '0.5.17':
                        'bzzr://b3196c0c582734d74810ef2241e728f6b83b6aa79d5f53732f29849c4bb4a25a',
                    '0.8.16':
                        'ipfs://122097ffe1485d914b655bdfa0b69dd73c107ff8a82b6e5dd22b6b11dbaac16b428a',
                };
                it(`should get metadata hash ${HASHES[version]}`, () => {
                    expect(evm.metadataHash).to.be.equal(HASHES[version]);
                });
            }

            it('should get CFG with 1 block & `revert`', () => {
                const blocks = evm.getBlocks();

                expect(Object.keys(blocks)).to.be.length(1);
                expect(blocks[0].exit.opcode).to.be.equal(OPCODES.REVERT);

                expect(blocks[0].stmts).to.be.length(1);
            });

            it('should decompile bytecode', () => {
                expect(evm.decompile()).to.be.equal('revert();\n');
            });
        });
    });
});
