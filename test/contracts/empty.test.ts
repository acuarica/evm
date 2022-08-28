import { expect } from 'chai';
import EVM from '../utils/evmtest';
import { compile, solcs, VERSIONS } from './utils/solc';
import { OPCODES } from '../../src/opcode';

const HASHES = {
    '0.5.5': 'bzzr://096a513e029cd483d2b09f7149099a6290d4ad077ecc811a012c5e7fc25514cd',
    '0.5.17': 'bzzr://b3196c0c582734d74810ef2241e728f6b83b6aa79d5f53732f29849c4bb4a25a',
    '0.8.16': 'ipfs://122097ffe1485d914b655bdfa0b69dd73c107ff8a82b6e5dd22b6b11dbaac16b428a',
};

const DECOMPILE = `revert();
`;

describe('contracts::empty', () => {
    VERSIONS.forEach(version => {
        describe(`using solc-v${solcs[version].version()}`, () => {
            const CONTRACT = `contract Empty { }`;

            let evm: EVM;

            before(() => {
                evm = new EVM(compile('Empty', CONTRACT, version));
            });

            it('should not detect selfdestruct', () => {
                expect(evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.false;
                expect(evm.containsOpcode('SELFDESTRUCT')).to.be.false;
            });

            it('should not have functions', () => {
                expect(evm.getFunctions()).to.be.empty;
            });

            it('should not have events', () => {
                expect(evm.getEvents()).to.be.empty;
            });

            it('should get metadata hash', () => {
                expect(evm.getMetadataHash()).to.be.equal(HASHES[version]);
            });

            it('should decompile bytecode', () => {
                expect(evm.decompile()).to.be.equal(DECOMPILE);
            });
        });
    });
});
