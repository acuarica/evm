import { expect } from 'chai';

import { Contract, OPCODES } from 'sevm';

import { contracts } from '../utils/solc';

contracts('selfdestruct', (compile, fallback, version) => {
    let contract: Contract;

    if (version === '0.8.16') return;

    // eslint-disable-next-line mocha/no-top-level-hooks
    before(function () {
        const src = `contract Test {
            ${fallback}() external payable {
                selfdestruct(msg.sender);
            }
        }`;
        contract = new Contract(compile(src, this, { enabled: true }).bytecode);
    });

    it('should detect selfdestruct', function () {
        expect(contract.evm.containsOpcode(OPCODES.SELFDESTRUCT)).to.be.true;
        expect(contract.evm.containsOpcode('SELFDESTRUCT')).to.be.true;
    });

    it('should `decompile` bytecode', function () {
        expect(contract.decompile()).to.be.equal('selfdestruct(msg.sender);\n');
    });
});
