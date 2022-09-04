import { expect } from 'chai';
import { EVM } from '../../src';

export function verifyBlocks(evm: EVM) {
    const { blocks } = evm.getBlocks();

    const dups = [];
    for (const [, block] of Object.entries(blocks)) {
        expect(block.opcodes).to.be.not.empty;
        // expect(block.opcodes.map(op => op.mnemonic)).to.not.contain('JUMP');
        expect(block.exit.mnemonic).to.be.oneOf(['STOP', 'RETURN', 'JUMP', 'JUMPI', 'REVERT']);

        // expect(block.opcodes).to.not.contain.oneOf(dups);

        dups.push(...block.opcodes);
    }
}
