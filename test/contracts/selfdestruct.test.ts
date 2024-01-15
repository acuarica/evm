import { expect } from 'chai';

import { Contract } from 'sevm';

import { contracts } from '../utils/solc';

contracts('selfdestruct', (compile, fallback, version) => {
    if (version === '0.8.16' || version === '0.5.5' || version === '0.5.17') return;

    it('should detect `SELFDESTRUCT` and `decompile` bytecode', function () {
        const src = `contract Test {
            ${fallback}() external payable {
                selfdestruct(payable(msg.sender));
            }
        }`;
        const contract = new Contract(compile(src, this, {
            optimizer: { enabled: true },
            ignoreWarnings: true,
        }).bytecode);

        const text = contract.solidify({ license: null, pragma: false });
        expect(text).to.be.equal(
            `contract Contract {

    ${fallback}() external payable {
        selfdestruct(msg.sender);
    }

}
`
        );
    });
});
