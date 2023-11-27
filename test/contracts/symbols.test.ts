import { expect } from 'chai';

import { Contract, sol } from 'sevm';

import { fnselector } from '../utils/selector';
import { contracts } from '../utils/solc';

contracts('symbols', compile => {
    let contract: Contract;

    // eslint-disable-next-line mocha/no-top-level-hooks
    before(function () {
        const src = `contract Test {
            function getBlockHash() public view returns (bytes32) { return blockhash(7); }
            function getBalance(address eoa) public view returns (uint256) { return eoa.balance; }
            function getThis() public view returns (address) { return address(this); }
        }`;
        contract = new Contract(compile(src, this).bytecode);
    });

    it('should find symbol opcodes', function () {
        const opcodes = contract.evm.opcodes;
        expect(opcodes.filter(op => op.mnemonic === 'BLOCKHASH')).to.be.of.length(1);
        expect(opcodes.filter(op => op.mnemonic === 'BALANCE')).to.be.of.length(1);
        expect(opcodes.filter(op => op.mnemonic === 'ADDRESS')).to.be.of.length(1);
    });

    [
        { sig: 'getBlockHash()', value: 'return blockhash(0x7);' },
        { sig: 'getBalance(address)', value: 'return _arg0.balance;' },
        { sig: 'getThis()', value: 'return address(this);' },
    ].forEach(({ sig, value }) => {
        it(`should find symbol block for \`${sig}\``, function () {
            const selector = fnselector(sig);
            expect(sol`${contract.functions[selector].stmts.at(-1)!}`).to.be.equal(value);
        });
    });

    it('should find `BLOCKHASH`, `BALANCE` and `ADDRESS` symbols', function () {
        const text = contract.decompile();
        expect(text, `decompiled bytecode\n${text}`).to.match(/return blockhash\(0x7\);$/m);
        expect(text, `decompiled bytecode\n${text}`).to.match(/return _arg0.balance;$/m);
        expect(text, `decompiled bytecode\n${text}`).to.match(/return address\(this\);$/m);
    });
});
