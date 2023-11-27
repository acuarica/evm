import { expect } from 'chai';

import { Contract, OPCODES } from 'sevm';

import { contracts } from '../utils/solc';

contracts('selfdestruct', (compile, fallback, version) => {
    if (version === '0.8.16') return;

    it('should detect `SELFDESTRUCT` and `decompile` bytecode', function () {
        const src = `contract Test {
            ${fallback}() external payable {
                selfdestruct(msg.sender);
            }
        }`;
        const contract = new Contract(compile(src, this, { enabled: true }).bytecode);
        expect(contract.evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.true;
        expect(contract.evm.containsOpcode('SELFDESTRUCT')).to.be.true;

        expect(contract.decompile()).to.be.equal('selfdestruct(msg.sender);\n');
    });
});
