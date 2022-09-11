import { expect } from 'chai';
import { FunctionFragment, Interface } from 'ethers/lib/utils';
import EVM from '../utils/evmtest';
import { contract } from './utils/solc';

contract('symbols', compile => {
    const CONTRACT = `
        contract C {
            function getBlockHash() public view returns (bytes32) { return blockhash(7); }
            function getBalance(address eoa) public view returns (uint256) { return eoa.balance; }
            function getThis() public view returns (address) { return address(this); }
        }`;

    let evm: EVM;
    let text: string;

    before(() => {
        evm = new EVM(compile(CONTRACT));
        text = evm.decompile();
    });

    it('should find symbol opcodes', () => {
        expect(evm.opcodes.filter(op => op.mnemonic === 'BLOCKHASH')).to.be.of.length(1);
        expect(evm.opcodes.filter(op => op.mnemonic === 'BALANCE')).to.be.of.length(1);
        expect(evm.opcodes.filter(op => op.mnemonic === 'ADDRESS')).to.be.of.length(1);
    });

    [
        { sig: 'getBlockHash()', value: 'return blockhash(7);' },
        { sig: 'getBalance(address)', value: 'return _arg0.balance;' },
        { sig: 'getThis()', value: 'return this;' },
    ].forEach(({ sig, value }) => {
        const selector = Interface.getSighash(FunctionFragment.from(sig)).substring(2);
        it('should find symbol blocks', () => {
            const last = evm.contract.functions[selector].stmts.at(-1)!.toString();
            expect(last).to.be.equal(value);
        });
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
