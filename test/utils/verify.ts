import { expect } from 'chai';
import { EVM } from '../../src';

export function verifyBlocks(evm: EVM) {
    const blocks = evm.getBlocks();

    for (const [, block] of Object.entries(blocks)) {
        expect(block.opcodes).to.be.not.empty;
        expect(block.exit.mnemonic).to.be.oneOf(['STOP', 'RETURN', 'JUMP', 'JUMPI', 'REVERT']);
    }
}
