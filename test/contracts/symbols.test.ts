import { expect, config } from 'chai';
import EVM from '../utils/evmtest';
import { verifyBlocks } from '../utils/verify';
import { compile, contract } from './utils/solc';

config.truncateThreshold = 0; // disable truncating

contract('contracts::symbols', version => {
    const CONTRACT = `
        contract C {
            function getBlockHash() public view returns (bytes32) { return blockhash(7); }
            function getBalance(address eoa) public view returns (uint256) { return eoa.balance; }
            function getThis() public view returns (address) { return address(this); }
        }`;

    let evm: EVM;
    let text: string;

    before(() => {
        evm = new EVM(compile('C', CONTRACT, version));
        text = evm.decompile();
    });

    it('should have verified blocks', () => {
        verifyBlocks(evm);
    });

    it('should find symbol opcodes', () => {
        expect(evm.opcodes.filter(op => op.mnemonic === 'BLOCKHASH')).to.be.of.length(1);
        expect(evm.opcodes.filter(op => op.mnemonic === 'BALANCE')).to.be.of.length(1);
        expect(evm.opcodes.filter(op => op.mnemonic === 'ADDRESS')).to.be.of.length(1);
    });

    it('should find symbol blocks', () => {
        const lasts = Object.values(evm.getBlocks().blocks).map(block =>
            block.stmts.at(-1)?.toString()
        );
        expect('return blockhash(7);').to.be.oneOf(lasts);
        expect('return _arg0.balance;').to.be.oneOf(lasts);
        expect('return this;').to.be.oneOf(lasts);
    });

    it('should find `BLOCKHASH` symbol', () => {
        expect(text, `decompiled bytecode\n${text}`).to.match(/return blockhash\(7\);$/m);
    });

    it('should find `BALANCE` symbol', () => {
        expect(text, `decompiled bytecode\n${text}`).to.match(/return _arg0.balance;$/m);
    });

    it('should find `ADDRESS` symbol', () => {
        expect(text, `decompiled bytecode\n${text}`).to.match(/return this;$/m);
    });
});
